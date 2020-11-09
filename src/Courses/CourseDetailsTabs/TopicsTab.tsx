import React, { useState } from 'react';
import TopicsList from '../TopicsList';
import { Accordion, Card, Row, Col, Modal, Alert, Button } from 'react-bootstrap';
import { CourseObject, TopicObject, UnitObject } from '../CourseInterfaces';
import { EditToggleButton } from '../../Components/EditToggleButton';
import { UserRole, getUserRole } from '../../Enums/UserRole';
import { FaPlusCircle, FaTrash } from 'react-icons/fa';
import _ from 'lodash';
import { ConfirmationModal } from '../../Components/ConfirmationModal';
import { Droppable, Draggable, DragDropContext } from 'react-beautiful-dnd';
import { putUnit, putTopic, deleteTopic, deleteUnit, postUnit, postTopic } from '../../APIInterfaces/BackendAPI/Requests/CourseRequests';
import logger from '../../Utilities/Logger';

interface TopicsTabProps {
    course: CourseObject;
    setCourse?: (course: CourseObject) => void;
}

export const TopicsTab: React.FC<TopicsTabProps> = ({ course, setCourse }) => {
    const DEFAULT_CONFIRMATION_PARAMETERS = {
        show: false,
        onConfirm: null,
        identifierText: ''
    };

    const [inEditMode, setInEditMode] = useState<boolean>(false);
    const [error, setError] = useState<Error | null | undefined>(null);
    const userType: UserRole = getUserRole();
    const [confirmationParamters, setConfirmationParamters] = useState<{ show: boolean, identifierText: string, onConfirm?: (() => unknown) | null }>(DEFAULT_CONFIRMATION_PARAMETERS);

    const showEditTopic = (e: any, unitIdentifier: number, topicIdentifier: number) => {
        logger.info(`Editing topic ${topicIdentifier} in unit ${unitIdentifier}`);
        let unit = _.find(course.units, ['id', unitIdentifier]);
        logger.info(unit);
        if (!unit) {
            logger.error(`Cannot find unit with identifier ${unitIdentifier}`);
            return;
        }

        const topic = _.find(unit.topics, ['id', topicIdentifier]);
        if (!topic) {
            logger.error(`Cannot find topic with id ${topicIdentifier} in unit with id ${unitIdentifier}`);
            return;
        }
    };

    const removeTopic = async (unitId: number, topicId: number) => {
        try {
            setError(null);
            await deleteTopic({
                id: topicId
            });

            let newCourse: CourseObject = { ...course };
            let unit = _.find(newCourse.units, ['id', unitId]);

            if (!unit) {
                logger.error(`Could not find a unit with id ${unitId}`);
                return;
            }

            const deletedTopic = _.find(unit.topics, ['id', topicId]);
            // Decrement everything after
            if (!_.isNil(deletedTopic)) {
                _.filter(unit.topics, topic => topic.contentOrder > deletedTopic.contentOrder).forEach(topic => topic.contentOrder--);
            }

            unit.topics = _.reject(unit.topics, ['id', topicId]);
            setCourse?.(newCourse);
        } catch (e) {
            setError(e);
        }
    };

    const onTopicDeleteClicked = (e: any, unitId: number, topicId: number) => {
        setConfirmationParamters({
            show: true,
            // In the future we might want to pass something like topic name here
            identifierText: 'this topic',
            onConfirm: _.partial(removeTopic, unitId, topicId)
        });
    };

    const createTopic = async (courseUnitContentId: number) => {
        try {
            setError(null);
            const result = await postTopic({
                data: {
                    courseUnitContentId
                }
            });

            let newCourse: CourseObject = new CourseObject(course);
            let unit = _.find(newCourse.units, ['id', courseUnitContentId]);

            if (!unit) {
                logger.error(`Could not find a unit with id ${courseUnitContentId}`);
                return;
            }

            unit.topics.push(new TopicObject(result.data.data));
            setCourse?.(newCourse);
        } catch (e) {
            setError(e);
        }
    };

    const addTopicClick = (e: React.MouseEvent<HTMLSpanElement, MouseEvent> | React.KeyboardEvent<HTMLSpanElement>, courseUnitContentId: number) => {
        e.stopPropagation();
        createTopic(courseUnitContentId);
    };

    const addUnit = async (courseId: number) => {
        try {
            setError(null);
            const result = await postUnit({
                data: {
                    courseId
                }
            });
            let newCourse: CourseObject = new CourseObject(course);
            newCourse.units.push(new UnitObject(result.data.data));
            setCourse?.(newCourse);
        } catch (e) {
            setError(e);
        }
    };

    const addUnitClick = async (_e: any, courseId: number) => {
        addUnit(courseId);
    };

    const removeUnit = async (unitId: number) => {
        try {
            setError(null);
            await deleteUnit({
                id: unitId
            });
            let newCourse: CourseObject = new CourseObject(course);
            const deletedUnit = _.find(newCourse.units, ['id', unitId]);
            // Decrement everything after
            if (!_.isNil(deletedUnit)) {
                _.filter(newCourse.units, unit => unit.contentOrder > deletedUnit.contentOrder).forEach(unit => unit.contentOrder--);
            }
            newCourse.units = _.reject(newCourse.units, ['id', unitId]);
            setCourse?.(newCourse);
        } catch (e) {
            setError(e);
        }
    };

    const removeUnitClick = async (e: React.MouseEvent<HTMLSpanElement, MouseEvent> | React.KeyboardEvent<HTMLSpanElement>, unitId: number) => {
        e.stopPropagation();
        setConfirmationParamters({
            show: true,
            // In the future we might want to pass something like topic name here
            identifierText: 'this unit',
            onConfirm: _.partial(removeUnit, unitId)
        });
    };

    const onUnitBlur = async (event: React.FocusEvent<HTMLHeadingElement>, unitId: number) => {
        try {
            setError(null);
            let newCourse = _.cloneDeep(course);
            let updatingUnit = _.find(newCourse.units, ['id', unitId]);
            if (!updatingUnit) {
                logger.error(`Could not find a unit with the unique identifier ${unitId}`);
                return;
            }
            updatingUnit.name = event.target.innerText;
            await putUnit({
                id: unitId,
                data: {
                    name: event.target.innerText
                }
            });
            setCourse?.(newCourse);
        } catch (e) {
            setError(e);
        }
    };

    const onUnitDragEnd = async (result: any) => {
        const { draggableId: unitDraggableId } = result;
        const unitIdRegex = /^unitRow(\d+)$/;
        const newContentOrder = result.destination.index + 1;
        // If exec doesn't match the result will be null
        // If it does succeed the index `1` will always be the group above
        const unitId = unitIdRegex.exec(unitDraggableId)?.[1];

        try {
            if (_.isNil(unitId)) {
                // This should not be possible
                logger.error('unitId was nil when dropping');
                throw new Error('Something went wrong with drag and drop');
            }

            // TODO when should the error disappear
            setError(null);

            const newCourse = _.cloneDeep(course);
            const [removed] = newCourse.units.splice(result.source.index, 1);
            newCourse.units.splice(result.destination.index, 0, removed);
            setCourse?.(newCourse);

            const response = await putUnit({
                id: parseInt(unitId, 10),
                data: {
                    contentOrder: newContentOrder
                    // Used to test error handling
                    // contentOrder: 2147483649
                }
            });

            // The response for the put returns the updated objects, update the units from what the backend has
            response.data.data.updatesResult.forEach((returnedUnit: Partial<UnitObject>) => {
                const existingUnit = _.find(newCourse.units, ['id', returnedUnit.id]);
                Object.assign(existingUnit, returnedUnit);
            });
            setCourse?.(new CourseObject(newCourse));
        } catch (e) {
            setError(e);
            setCourse?.(course);
        }
    };

    const onTopicDragEnd = async (result: any) => {
        try {
            const { draggableId: topicDraggableId } = result;
            // Index is 0 based, while content order is 1 based
            const newContentOrder = result.destination.index + 1;
            const topicIdRegex = /^topic-(\d+)$/;
            // If exec doesn't match the result will be null
            // If it does succeed the index `1` will always be the group above
            const topicId = topicIdRegex.exec(topicDraggableId)?.[1];

            const sourceUnitDroppableId = result.source.droppableId;
            const destinationUnitDroppableId = result.destination.droppableId;

            const updates: Partial<TopicObject> = {
                contentOrder: newContentOrder
            };
            const unitIdRegex = /^topicList-(\d+)$/;
            const destinationUnitId = unitIdRegex.exec(destinationUnitDroppableId)?.[1];
            const sourceUnitId = unitIdRegex.exec(sourceUnitDroppableId)?.[1];

            if (_.isNil(destinationUnitId)) {
                logger.error('Could not parse desintationUnitId');
                return;
            }

            if (_.isNil(sourceUnitId)) {
                logger.error('Could not parse sourceUnitId');
                return;
            }

            if (sourceUnitDroppableId !== destinationUnitDroppableId) {
                if (_.isNil(destinationUnitId)) {
                    logger.error('destinationUnitId was somehow nil');
                    throw new Error('Something went wrong with drag and drop');
                }
                updates.courseUnitContentId = parseInt(destinationUnitId, 10);
            }

            const newCourse = _.cloneDeep(course);
            const sourceUnit = _.find(newCourse.units, ['id', parseInt(sourceUnitId, 10)]);
            const destinationUnit = sourceUnitId === destinationUnitId ? sourceUnit : _.find(newCourse.units, ['id', parseInt(destinationUnitId, 10)]);

            if (_.isNil(sourceUnit)) {
                logger.error('Could not find source unit');
                return;
            }

            if (_.isNil(destinationUnit)) {
                logger.error('Could not find destination unit');
                return;
            }
            const [removed] = sourceUnit.topics.splice(result.source.index, 1);
            destinationUnit.topics.splice(result.destination.index, 0, removed);

            setCourse?.(newCourse);
            setError(null);
            if (_.isNil(topicId)) {
                // This should not be possible
                logger.error('topicId was nil when dropping');
                throw new Error('Something went wrong with drag and drop');
            }
            const response = await putTopic({
                id: parseInt(topicId, 10),
                data: updates
            });

            response.data.data.updatesResult.forEach((returnedTopic: Partial<TopicObject>) => {
                const existingUnit = _.find(newCourse.units, ['id', returnedTopic.courseUnitContentId]);
                if (_.isNil(existingUnit)) {
                    logger.error('Could not find topics unit');
                    throw new Error('Drag and drop encountered an unexpected error');
                }
                const existingTopic = _.find(existingUnit.topics, ['id', returnedTopic.id]);
                Object.assign(existingTopic, returnedTopic);
            });
            setCourse?.(new CourseObject(newCourse));
        } catch (e) {
            setError(e);
            setCourse?.(course);
        }
    };

    const onDragEnd = (result: any) => {
        if (!result.destination) {
            return;
        }

        if (result.destination.index === result.source.index && result.destination.droppableId === result.source.droppableId) {
            return;
        }

        logger.info('onDragEnd!', result);

        if (result.type === 'UNIT') {
            onUnitDragEnd(result);
        } else if (result.type === 'TOPIC') {
            onTopicDragEnd(result);
        } else {
            logger.error(`Invalid result.type "${result.type}"`);
        }
    };

    return (
        <>
            <ConfirmationModal
                onConfirm={() => {
                    confirmationParamters.onConfirm?.();
                    setConfirmationParamters(DEFAULT_CONFIRMATION_PARAMETERS);
                }}
                onHide={() => {
                    setConfirmationParamters(DEFAULT_CONFIRMATION_PARAMETERS);
                }}
                show={confirmationParamters.show}
                headerContent={<h5>Confirm delete</h5>}
                bodyContent={`Are you sure you want to remove ${confirmationParamters.identifierText}?`}
            />
            {error && <Alert variant="danger">{error.message}</Alert>}
            <Row style={{padding: '0.5em'}}>
                <Col xs={1} md={1}><h4>Units</h4></Col>
                <Col>
                    {userType !== UserRole.STUDENT && (
                        <Row style={{justifyContent: 'flex-end', paddingRight: '1em'}}>
                            {/* <span style={style} onClick={onClick} role="button" tabIndex={0} onKeyPress={onClick} > */}
                            {
                                inEditMode &&
                                <Button variant='outline-success'
                                    tabIndex={0}
                                    onClick={_.partial(addUnitClick, _, course.id)}
                                    onKeyPress={_.partial(addUnitClick, _, course.id)}
                                >
                                    <FaPlusCircle /> New Unit
                                </Button>
                            }
                            <EditToggleButton
                                selectedState={inEditMode}
                                onClick={() => { setInEditMode(!inEditMode); }}
                                style={{
                                    padding: '0em 0em 0em 1em'
                                }}
                            />
                        </Row>
                    )}
                </Col>
            </Row>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId='unitsList' type='UNIT'>
                    {
                        (provided: any) => (
                            <>
                                <div ref={provided.innerRef} style={{ backgroundColor: 'white' }} {...provided.droppableProps}>
                                    {course?.units?.map((unit: any, index) => {
                                        const showEditWithUnitId = _.curry(showEditTopic)(_, unit.id);
                                        const onTopicDeleteClickedWithUnitId = _.curry(onTopicDeleteClicked)(_, unit.id);

                                        return (
                                            <Draggable draggableId={`unitRow${unit.id}`} index={index} key={`problem-row-${unit.id}`} isDragDisabled={!inEditMode}>
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} key={unit.id}>
                                                        <Accordion defaultActiveKey="1">
                                                            <Card>
                                                                <Accordion.Toggle as={Card.Header} eventKey="0">
                                                                    <Row>
                                                                        <Col>
                                                                            {
                                                                                // This is complaining because of the click event, however it is not a true click event, it is just stopping the accordion
                                                                                // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                                                                            } <h4
                                                                                contentEditable={inEditMode}
                                                                                suppressContentEditableWarning={true}
                                                                                className='active-editable'
                                                                                onClick={inEditMode ? ((event: React.MouseEvent<HTMLHeadingElement, MouseEvent>) => { event.stopPropagation(); }) : undefined}
                                                                                onKeyDown={(e: any) => {
                                                                                    if (e.keyCode === 13) {
                                                                                        e.preventDefault();
                                                                                        e.target.blur();
                                                                                    }
                                                                                }}
                                                                                onBlur={_.partial(onUnitBlur, _, unit.id)}
                                                                            >
                                                                                {unit.name}
                                                                            </h4>
                                                                        </Col>
                                                                        <Col />
                                                                        {
                                                                            inEditMode &&
                                                                            <div style={{ marginLeft: 'auto' }}>
                                                                                <span
                                                                                    role="button"
                                                                                    tabIndex={0}
                                                                                    style={{
                                                                                        padding: '6px'
                                                                                    }}
                                                                                    onClick={_.partial(removeUnitClick, _, unit.id)}
                                                                                    onKeyPress={_.partial(removeUnitClick, _, unit.id)}
                                                                                >
                                                                                    <FaTrash color='#AA0000' />
                                                                                </span>
                                                                                <span
                                                                                    role="button"
                                                                                    tabIndex={0}
                                                                                    style={{
                                                                                        padding: '6px'
                                                                                    }}
                                                                                    onClick={_.partial(addTopicClick, _, unit.id)}
                                                                                    onKeyPress={_.partial(addTopicClick, _, unit.id)}
                                                                                >
                                                                                    <FaPlusCircle color='#00AA00' />
                                                                                </span>
                                                                            </div>
                                                                        }
                                                                    </Row>
                                                                </Accordion.Toggle>
                                                                <Accordion.Collapse eventKey="0">
                                                                    <Card.Body>
                                                                        <TopicsList
                                                                            flush
                                                                            listOfTopics={unit.topics}
                                                                            showEditTopic={inEditMode ? showEditWithUnitId : undefined}
                                                                            removeTopic={onTopicDeleteClickedWithUnitId}
                                                                            unitUnique={unit.id}
                                                                        />
                                                                    </Card.Body>
                                                                </Accordion.Collapse>
                                                            </Card>
                                                        </Accordion>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })
                                    }
                                </div>
                            </>
                        )
                    }
                </ Droppable>
            </ DragDropContext>
        </>
    );
};

export default TopicsTab;
