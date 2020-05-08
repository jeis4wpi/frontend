import React, { useEffect, useState } from 'react';
import CourseList from './CourseList';
import AxiosRequest from '../Hooks/AxiosRequest';
import { chain, map, pick } from 'lodash';
import { CourseObject } from './CourseInterfaces';
import { Container, Row, Button, Col } from 'react-bootstrap';
import { BsPlusSquare } from 'react-icons/bs';
import Cookies from 'js-cookie';

interface CoursePageProps {

}

export const CoursePage: React.FC<CoursePageProps> = () => {
    const [courses, setCourses] = useState<Array<CourseObject>>([]);
    const userType = Cookies.get('userType');

    // Get the list of courses to render.
    useEffect(() => {
        (async () => {
            try {
                let res = await AxiosRequest.get('/courses');
                console.log(res.data.data);
                const courses: Array<CourseObject> = map(res.data?.data, obj => new CourseObject(obj));

                setCourses(courses);
            } catch (e) {
                console.log(e.response);
                setCourses([]);
            }
        })();
    }, []);

    return (
        <div>
            <Container>
                <Row>
                    <Col md={10}>
                        <h1>My Courses</h1>
                    </Col>
                    <Col md={2}>
                        {userType === 'Professor' && (
                            <Button className="float-right" style={{height: '100%'}}><BsPlusSquare /> Create Course</Button>
                        )}
                    </Col>
                </Row>
                <CourseList courses={courses}/>
            </Container>
        </div>
    );
};
export default CoursePage;