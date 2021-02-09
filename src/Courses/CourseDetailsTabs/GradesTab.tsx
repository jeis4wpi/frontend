import React, { useEffect, useState } from 'react';
import { Nav } from 'react-bootstrap';
import GradeTable from './GradeTable';
import _ from 'lodash';
import SubObjectDropdown from '../../Components/SubObjectDropdown';
import { UnitObject, TopicObject, ProblemObject, CourseObject } from '../CourseInterfaces';
import { UserRole, getUserRole } from '../../Enums/UserRole';
import logger from '../../Utilities/Logger';
import localPreferences from '../../Utilities/LocalPreferences';
import { getGrades } from '../../APIInterfaces/BackendAPI/Requests/CourseRequests';
import { GetGradesOptions } from '../../APIInterfaces/BackendAPI/RequestTypes/CourseRequestTypes';

interface GradesTabProps {
    course: CourseObject;
    setStudentGradesTab: (studentName: string, studentId: number) => void;
}

enum GradesView {
    OVERVIEW = 'Overview',
    UNITS = 'Units',
    TOPICS = 'Topics',
    PROBLEMS = 'Problems'
}

interface IDropdownCascade {
    unit?: UnitObject,
    topic?: TopicObject,
    problem?: ProblemObject
}

/**
 * This tab conditionally shows grades for either:
 *  1. A student, showing detailed grades for each topic, or:
 *  2. A professor, showing summary grades for each student.
 *
 */
export const GradesTab: React.FC<GradesTabProps> = ({course, setStudentGradesTab}) => {
    const [view, setView] = useState<string>(GradesView.OVERVIEW);
    const [selectedObjects, setSelectedObjects] = useState<IDropdownCascade>({});
    const [viewData, setViewData] = useState<Array<any>>([]);
    const userId: string | null = localPreferences.session.userId;
    const userType: UserRole = getUserRole();

    const handleChangedView = (selectedView: string | null) => {
        logger.debug('handling changing view', selectedView);
        if (_.isNil(selectedView)) {
            logger.error('The selectedView on the Grades tab is null. (TSNH)');
            return;
        }
        setView(selectedView);
        if (selectedView === GradesView.OVERVIEW) {
            setSelectedObjects({});
        } else if (_.startsWith(selectedView, GradesView.UNITS)) {
            const selectedUnitId = parseInt(_.trimStart(selectedView, `${GradesView.UNITS}-`), 10);
            setSelectedObjects({unit: _.find(course.units, ['id', selectedUnitId])});
        } else if (_.startsWith(selectedView, GradesView.TOPICS)) {
            const selectedTopicId = parseInt(_.trimStart(selectedView, `${GradesView.TOPICS}-`), 10);
            const selectedTopic = _.find(selectedObjects.unit?.topics, ['id', selectedTopicId]);
            setSelectedObjects({unit: selectedObjects.unit, topic: selectedTopic});
        } else if (_.startsWith(selectedView, GradesView.PROBLEMS)) {
            const selectedQuestionId = parseInt(_.trimStart(selectedView, `${GradesView.PROBLEMS}-`), 10);
            const selectedQuestion = _.find(selectedObjects.topic?.questions, ['id', selectedQuestionId]);
            setSelectedObjects({...selectedObjects, problem: selectedQuestion});
        } else {
            logger.error(`Unknown Grades view '${selectedView}'`);
        }
    };

    // This hook gets the grades for all users, filtered by the type of view selected.
    const getCourseGradesHook = () => {
        (async () => {
            if (_.isNil(course) || !course.id) return;
            const params: GetGradesOptions = {
                courseId: course.id
            };

            if (selectedObjects.problem) {
                params.questionId = selectedObjects.problem?.id;
            } else if (selectedObjects.topic) {
                params.topicId = selectedObjects.topic?.id;
            } else if (selectedObjects.unit) {
                params.unitId = selectedObjects.unit?.id;
            }

            if (userType === UserRole.STUDENT) {
                if (_.isNil(userId)) {
                    logger.error('Tried to get grades for a student but they did not have a user id');
                    throw new Error('Something went wrong');
                } else {
                    params.userId = parseInt(userId, 10);
                }
            }
            
            const res = await getGrades(params);

            const gradesArr: Array<any> = res.data.data || [];

            const flatGradesArr = _.map(gradesArr, grade => {
                // This order causes the id field from the user to take precedence.
                // One will have to be renamed when implementing URL querystrings for the Student's Grades view link.
                const mergedGrade = {...grade, ...grade.user};
                delete mergedGrade.user;
                return mergedGrade;
            });

            setViewData(flatGradesArr);
        })();
    };

    useEffect(getCourseGradesHook, [course.id, userId, selectedObjects]);

    if (!course) return null;

    return (
        <>
            <Nav fill variant='pills' activeKey={view} onSelect={(selectedKey: string | null) => handleChangedView(selectedKey)}>
                <Nav.Item>
                    <Nav.Link eventKey={GradesView.OVERVIEW}>
                        Overview
                    </Nav.Link>
                </Nav.Item>
                <SubObjectDropdown
                    title={selectedObjects.unit?.name || GradesView.UNITS}
                    eventKey={GradesView.UNITS}
                    eventKeyState={view}
                    subObjArray={course.units} />
                <SubObjectDropdown
                    title={selectedObjects.topic?.name || GradesView.TOPICS}
                    eventKey={GradesView.TOPICS}
                    eventKeyState={view}
                    subObjArray={selectedObjects.unit?.topics || []}
                    style={{visibility: selectedObjects.unit ? 'visible' : 'hidden'}} />
                <SubObjectDropdown
                    title={selectedObjects.problem ? `Problem ${selectedObjects.problem.problemNumber}` : GradesView.PROBLEMS}
                    eventKey={GradesView.PROBLEMS}
                    eventKeyState={view}
                    subObjArray={selectedObjects.topic?.questions.sort((a, b) => a.problemNumber < b.problemNumber ? -1 : 1) || []}
                    style={{visibility: selectedObjects.topic ? 'visible' : 'hidden'}} />
            </Nav>
            {viewData ?
                <GradeTable
                    courseName={course.name}
                    grades={viewData}
                    onRowClick={(_event: any, rowData: any) => {
                        setStudentGradesTab(rowData.firstName, rowData.id);
                    }} /> :
                <div>No data!</div>}
        </>
    );
};

export default GradesTab;
