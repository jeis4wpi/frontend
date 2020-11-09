import React, { useState } from 'react';
import { ListGroup, ListGroupItem, Row, Col, Button, Modal } from 'react-bootstrap';
import { TopicObject, TopicOverride } from './CourseInterfaces';
import { BsPencilSquare, BsTrash } from 'react-icons/bs';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import MomentUtils from '@date-io/moment';
import { DateTimePicker, MuiPickersUtilsProvider} from '@material-ui/pickers';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { UserRole, getUserRole, getUserId } from '../Enums/UserRole';
import moment from 'moment';
import TopicSettingsPage from './TopicSettings/TopicSettingsPage';

import './TopicList.css';
import logger from '../Utilities/Logger';

interface TopicsListProps {
    listOfTopics: Array<TopicObject>;
    flush?: boolean;
    // TODO: Remove, this is no longer being used from the parent scope.
    // Or, use it to update the name in the parent scope.
    showEditTopic?: _.CurriedFunction2<any, number, void>;
    removeTopic?: _.CurriedFunction2<any, number, void>;
    unitUnique?: number;
}

/**
 * Lists topics. Clicking into one will go to the problem sets.
 */
export const TopicsList: React.FC<TopicsListProps> = ({listOfTopics, flush, showEditTopic, removeTopic, unitUnique}) => {
    const [showSettingsModal, setShowSettingsModal] = useState<{state: boolean, topic: TopicObject | null}>({state: false, topic: null});
    const userType: UserRole = getUserRole();
    const userId: number = getUserId();

    const getActiveExtensions = (topic: TopicObject): Array<any> => {
        const now = moment();
        if (_.isEmpty(topic.studentTopicOverride)) return [];

        const activeExtensions: any[] = topic.studentTopicOverride.reduce((accum: TopicOverride[], extension) => {
            if (now.isBetween(extension.startDate, extension.deadDate, 'day', '[]')) {
                accum.push(extension);
            }
            return accum;
        }, []);

        return activeExtensions;
    };

    const renderSingleTopic = (topic: TopicObject) => {
        const activeExtensions = getActiveExtensions(topic);
        return (
            <div className='d-flex'>
                {/* If we're in edit mode, show the edit topic buttons. */}
                {(showEditTopic && removeTopic) ? (
                    <>
                        <Col md={8}>
                            <Row>
                                <Link to={loc =>(userType !== UserRole.STUDENT ?
                                    {pathname: `${loc.pathname}/topic/${topic.id}/settings`} :
                                    {pathname: `${loc.pathname}/topic/${topic.id}`, state: {problems: topic.questions}}
                                )}>
                                    <Col>
                                        <h5>{topic.name}</h5>
                                    </Col>
                                </Link>
                            </Row>
                        </Col>
                        <Col>
                            <Row style={{justifyContent: 'flex-end'}}>
                                <Button style={{alignSelf: 'flex-end', margin: '0em 1em'}} 
                                    onClick={()=>setShowSettingsModal({state: true, topic: topic})}
                                >
                                    <BsPencilSquare/> Edit
                                </Button>
                                <Button style={{alignSelf: 'flex-end', margin: '0em 1em'}} variant='danger' onClick={(e: any) => removeTopic(e, topic.id)}>
                                    <BsTrash /> Delete
                                </Button>
                            </Row>
                        </Col>
                    </>
                ) : (
                    <>
                        <Row>
                            <Col>
                                <Row>
                                    <Link to={loc =>(userType !== UserRole.STUDENT ?
                                        {pathname: `${loc.pathname}/topic/${topic.id}/grading`} :
                                        {pathname: `${loc.pathname}/topic/${topic.id}`, state: {problems: topic.questions}}
                                    )}>
                                        <Col>
                                            <h5>{topic.name}</h5>
                                        </Col>
                                    </Link>
                                </Row>
                                {activeExtensions.length > 0 && (
                                    <Row>
                                        { userType !== UserRole.STUDENT ? (
                                            <Link to={loc =>({pathname: `${loc.pathname}/settings`, selectedTopic: topic.id})}>
                                                <Col>
                                                    <p style={{color: 'black', fontStyle: 'italic'}}>
                                                        This topic has {activeExtensions.length} active extension{activeExtensions.length > 1 && 's'}
                                                    </p>
                                                </Col>
                                            </Link>
                                        ) : (
                                            <>
                                                { _.find(activeExtensions, ['userId', userId]) !== undefined && (
                                                    <Col>
                                                        <p style={{color: 'black', fontStyle: 'italic'}}>
                                                            You have an extension for this topic.
                                                        </p>
                                                    </Col>
                                                )}
                                            </>
                                        )}
                                    </Row>
                                )}
                            </Col>
                        </Row>
                        <MuiPickersUtilsProvider utils={MomentUtils}>
                            <>
                                <DateTimePicker
                                    style={{
                                        marginLeft: 'auto'
                                    }} 
                                    variant='inline'
                                    label='Start date'
                                    name={'start'}
                                    value={topic.startDate}
                                    onChange={()=>{}}
                                    inputVariant='outlined'
                                    disabled={true}
                                />

                                <DateTimePicker
                                    style={{
                                        marginLeft: '10px'
                                    }} 
                                    variant='inline'
                                    label='End date'
                                    name={'end'}
                                    value={topic.endDate}
                                    onChange={()=>{}}
                                    inputVariant='outlined'
                                    disabled={true}
                                />
                                {/* Show the Dead Date if != end, if student also now > end */}
                                {
                                    (!moment(topic.deadDate).isSame(moment(topic.endDate))) && 
                                (
                                    userType !== UserRole.STUDENT || 
                                    moment().isSameOrAfter(moment(topic.endDate))
                                ) &&
                                <DateTimePicker
                                    style={{
                                        marginLeft: '10px'
                                    }} 
                                    variant='inline'
                                    label='Dead date'
                                    name={'end'}
                                    value={topic.deadDate}
                                    onChange={()=>{}}
                                    inputVariant='outlined'
                                    disabled={true}
                                />
                                }
                            </>
                        </MuiPickersUtilsProvider>
                    </>
                )}
            </div>
        );};

    const getDraggableTopic = (provided: any, snapshot: any, rubric: any) => {
        if (rubric.source.index >= listOfTopics.length) {
            logger.error(`Tried moving ${rubric.source.index} which exceed list length ${listOfTopics.length}`);
            return <div/>;
        }
        
        const topic = listOfTopics[rubric.source.index];

        return (
            <ListGroupItem {...provided.draggableProps} {...provided.dragHandleProps} ref={provided.innerRef}>
                {renderSingleTopic(topic)}
            </ListGroupItem>
        );
    };


    return (
        <>
            {/* This could use a debug flag. */}
            {/* <DevTool control={control} /> */}
            <Droppable droppableId={`topicList-${unitUnique}`} renderClone={getDraggableTopic} type='TOPIC'>
                {(provided: any) => (
                    <ListGroup 
                        variant={flush ? 'flush' : undefined}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {
                            listOfTopics.length > 0 ? listOfTopics.map((topic, index) => {
                                return (
                                    <Draggable draggableId={`topic-${topic.id}`} index={index} key={`topic${topic.id}`} isDragDisabled={!showEditTopic}>
                                        {getDraggableTopic}
                                    </Draggable>
                                );
                            }) :
                                <p>There are no active topics in this unit</p>
                        }
                        {provided.placeholder}
                    </ListGroup>
                )}
            </Droppable>
            <Modal
                show={showSettingsModal.state}
                onHide={()=>setShowSettingsModal({state: false, topic: null})}
                className='fullscreen-modal'
            >
                <Modal.Header closeButton>
                    Edit Topic
                </Modal.Header>
                <Modal.Body>
                    <TopicSettingsPage topic={showSettingsModal.topic || undefined} />
                </Modal.Body>
            </Modal>
        </>
    );
};
export default TopicsList;