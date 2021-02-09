import { Drawer, Grid } from '@material-ui/core';
import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import MaterialTriSelect from '../../Components/MaterialTriSelect';
import { useCourseContext } from '../CourseProvider';
import { OverridesForm } from './OverridesForm';
import { UnitObject, UserObject, TopicObject, ProblemObject } from '../CourseInterfaces';

import './SettingsPage.css';

interface SettingsPageProps {

}

export const SettingsPage: React.FC<SettingsPageProps> = () => {
    const {course, users} = useCourseContext();
    const [selected, setSelected] = useState<{
        unit?: UnitObject, 
        topic?: TopicObject, 
        problem?: ProblemObject, 
        user?: UserObject
    }>({});

    return (
        <Container style={{marginBottom: (selected.user && selected.topic) ? '25rem' : undefined}}>
            <Row>
                <Col className='text-center'>
                    <h1>Extensions</h1>
                </Col>
            </Row>
            <MaterialTriSelect course={course} users={users} selected={selected} setSelected={setSelected} />
            <Drawer 
                className='black-drawer'
                anchor='bottom' 
                open={!!(selected.user && selected.topic)} 
                onClose={()=>{}}
                variant="persistent"
                SlideProps={{style: {height: '20rem', backgroundColor: 'rgb(52, 58, 64)', color: 'rgba(255, 255, 255, 0.8)'}}}
            >
                <Grid container>
                    <Grid container item>
                        { selected.user && (
                            <OverridesForm topic={selected?.topic} userId={selected.user.id} problem={selected?.problem} />
                        )}
                    </Grid>
                </Grid>
            </Drawer>
        </Container>
    );
};

export default SettingsPage;