import React, { useEffect, useState } from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import { useRouteMatch, useHistory } from 'react-router-dom';
import { CourseObject } from './CourseInterfaces';
import { UserRole, getUserRole, getUserId } from '../Enums/UserRole';
import { CourseDetailsTab } from './CourseDetailsTabs/CourseDetailsTab';
import { useCourseContext } from './CourseProvider';
import { useQuery } from '../Hooks/UseQuery';
import EnrollmentsTab from './CourseDetailsTabs/EnrollmentsTab';
import TopicsTab from './CourseDetailsTabs/TopicsTab';
import GradesTab from './CourseDetailsTabs/GradesTab';
import StatisticsTab from './CourseDetailsTabs/StatisticsTab';

// Lazy loading these components does not work well with React Bootstrap, potentially
// because is uses a deprecated method of traversing the DOM. This might work better with MUI Tabs.
// const EnrollmentsTab = lazy(() => import('./CourseDetailsTabs/EnrollmentsTab'));
// const TopicsTab = lazy(() => import('./CourseDetailsTabs/TopicsTab'));
// const GradesTab = lazy(() => import('./CourseDetailsTabs/GradesTab'));
// const StatisticsTab = lazy(() => import('./CourseDetailsTabs/StatisticsTab'));

interface CourseDetailsPageProps {

}

enum CourseDetailsTabs {
    TOPICS = 'Topics',
    ENROLLMENTS = 'Enrollments',
    DETAILS = 'Details',
    GRADES = 'Grades',
    STATISTICS = 'Statistics',
    STUDENT_GRADES = 'Student Grades',
}

/**
 * This page renders a tabbed view of course details. If a user is a professor, this will have an additional tab
 * to view enrolled students and send emails.
 *
 */
export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = () => {
    const {course, setCourse, error} = useCourseContext();
    const queryParams = useQuery();
    const tab = queryParams.get('tab') as CourseDetailsTabs | null;
    const [activeTab, setActiveTab] = useState<CourseDetailsTabs>(tab ?? CourseDetailsTabs.DETAILS);
    const userType: UserRole = getUserRole();
    const userId: number = getUserId();
    const [studentNameAndId, setStudentNameAndId] = useState<{name: string, userId: number} | null>(null);
    const { url } = useRouteMatch();
    const history = useHistory();

    // TODO: Back navigation with this approach seems slow. Is there a faster way to detect the url change?
    useEffect(()=>{
        setActiveTab(tab ?? CourseDetailsTabs.DETAILS);
    }, [tab]);

    const setStudentGradesTab = (studentName: string, studentId: number) => {
        setStudentNameAndId({name: studentName, userId: studentId});
        setActiveTab(CourseDetailsTabs.STUDENT_GRADES);
    };


    if (course.id <= 0) return <Container>Loading your course...</Container>;

    return (
        <Container>
            <Tabs
                activeKey={activeTab}
                defaultActiveKey={tab ?? CourseDetailsTabs.DETAILS}
                id='course-details-tabs'
                onSelect={(activeTab: any) => {
                    setActiveTab(activeTab);
                    setStudentNameAndId(null);
                    history.push(`${url}?tab=${activeTab}`);
                }}>
                <Tab
                    mountOnEnter
                    eventKey={CourseDetailsTabs.DETAILS} title={CourseDetailsTabs.DETAILS}
                    style={{marginBottom:'10px'}}
                >
                    {/* TODO: pass loading state between CourseProvider */}
                    <CourseDetailsTab course={course} error={error} loading={false} setCourse={setCourse} />
                </Tab>
                <Tab
                    mountOnEnter
                    unmountOnExit
                    eventKey={CourseDetailsTabs.TOPICS}
                    title={CourseDetailsTabs.TOPICS}
                >
                    <TopicsTab course={course} setCourse={setCourse} />
                </Tab>
                <Tab
                    mountOnEnter
                    eventKey={CourseDetailsTabs.ENROLLMENTS}
                    title={CourseDetailsTabs.ENROLLMENTS}
                >
                    <EnrollmentsTab />
                </Tab>
                <Tab
                    mountOnEnter
                    eventKey={CourseDetailsTabs.GRADES}
                    title={CourseDetailsTabs.GRADES}
                >
                    {/* Students' Grades view is really the statisics view. */}
                    {userType === UserRole.STUDENT ?
                        <StatisticsTab course={course} userId={userId} /> :
                        <GradesTab course={course} setStudentGradesTab={setStudentGradesTab} />}
                </Tab>
                {userType !== UserRole.STUDENT && (
                    <Tab
                        mountOnEnter
                        eventKey={CourseDetailsTabs.STATISTICS}
                        title={CourseDetailsTabs.STATISTICS}
                    >
                        <StatisticsTab course={course} />
                    </Tab>)}
                {studentNameAndId !== null && (
                    <Tab
                        mountOnEnter
                        eventKey={CourseDetailsTabs.STUDENT_GRADES}
                        title={`${studentNameAndId.name}'s Grades`}
                    >
                        <StatisticsTab course={course} userId={studentNameAndId.userId} />
                    </Tab>)}
            </Tabs>
        </Container>
    );
};

export default CourseDetailsPage;