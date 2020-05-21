import React, { useEffect, useState, useCallback } from 'react';
import { ICourseTemplate } from '../CourseInterfaces';
import CourseTemplateList from './CourseTemplateList';
import { FormControl, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import EnterRightAnimWrapper from './EnterRightAnimWrapper';
import {useDropzone} from 'react-dropzone';

interface CourseCreationPageProps {
    
}

/**
 * This page prompts a user to create a new course from an existing template.
 * It renders a list of possible templates and a create button.
 * 
 */
export const CourseCreationPage: React.FC<CourseCreationPageProps> = () => {
    const [courseTemplates, setCourseTemplates] = useState<Array<ICourseTemplate>>([]);
    const [filteredCourseTemplates, setFilteredCourseTemplates] = useState<Array<ICourseTemplate>>([]);
    const onDrop = useCallback(acceptedFiles => {
        // TODO: Here, we should upload the DEF file to the server, and then move to the next page.
        console.log(acceptedFiles);
    }, []);
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

    useEffect(() => {
        const mock_templates: Array<ICourseTemplate> = [
            {name: 'Curriculum 1', id: 1}, 
            {name: 'Course 1', id: 2},
            {name: 'Rederly Default Curriculum', id: 3}
        ];
        setCourseTemplates(mock_templates);
        setFilteredCourseTemplates(mock_templates);
    }, []);

    const filterCourseTemplates = (e: any) => {
        setFilteredCourseTemplates(courseTemplates.filter(template => (
            template.name.toLowerCase().indexOf(e.target.value.toLowerCase()) > -1
        )));
    };
    
    return (
        <EnterRightAnimWrapper>
            <div {...getRootProps()}>
                <input type="file" {...getInputProps()} />
                { isDragActive ? (
                    <div>Upload that file!</div>
                ) : (
                    <>
                        <h1>Select a course template, or upload an existing course.</h1><Button className="float-right">Upload DEF</Button>
                        <FormControl type="search" placeholder="Search by Course or Curriculum Name" onChange={filterCourseTemplates} />
                        <CourseTemplateList courseTemplates={filteredCourseTemplates} />
                    </>
                )
                }
            </div>
        </EnterRightAnimWrapper>
    );
};

export default CourseCreationPage;