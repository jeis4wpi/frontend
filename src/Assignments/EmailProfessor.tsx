import React, { useState } from 'react';
import { postEmailProfessor } from '../APIInterfaces/BackendAPI/Requests/CourseRequests';
import { ProblemObject, TopicObject } from '../Courses/CourseInterfaces';
import { useCourseContext } from '../Courses/CourseProvider';
import { Alert, Button, Form, FormControl, FormGroup, FormLabel, Modal, ModalBody, ModalFooter, ModalTitle } from 'react-bootstrap';
import ModalHeader from 'react-bootstrap/ModalHeader';
import useAlertState from '../Hooks/useAlertState';

interface EmailProfessorProps {
    topic: TopicObject;
    problem: ProblemObject;
}

/**
 * This is a button-and-model pair.
 */
export const EmailProfessor: React.FC<EmailProfessorProps> = ({problem}) => {
    const {course} = useCourseContext();
    const [content, setContent] = useState<string>('');
    const [show, setShow] = useState<boolean>(false);
    const [{message: sendEmailRespMsg, variant: sendEmailRespAlertType}, setSendEmailRespMsg] = useAlertState();

    const onClick = async () => {
        try {
            const res = await postEmailProfessor({
                courseId: course.id,
                content: content,
                question: {
                    id: problem.id,
                }
            });
            setSendEmailRespMsg({message: res.data.message ?? 'Email sent.', variant: 'success'});
        } catch (e) {
            console.error(e);
            setSendEmailRespMsg({message: e.message, variant: 'danger'});
        }
    };

    return (
        <>
            <Button style={{ marginLeft: '1em' }} onClick={()=>{setSendEmailRespMsg({message: '', variant: 'warning'}); setShow(true);}}>Email Professor</Button>
            <Modal show={show} onHide={()=>setShow(false)}>
                <ModalHeader closeButton>
                    <ModalTitle>Email Your Professor</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <Form>
                        <Alert variant={sendEmailRespAlertType} show={sendEmailRespMsg.length > 0}>{sendEmailRespMsg}</Alert>
                        <FormGroup>
                            <FormLabel>Compose your email below:</FormLabel>
                            <FormControl 
                                as='textarea' 
                                size='sm' style={{height: '200px'}}
                                autoComplete='off'
                                onChange={(e: any) => setContent(e.target.value)}
                            />
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button 
                        variant="primary" 
                        onClick={onClick}
                        // disabled={sendEmailRespAlertType === 'success'}
                    >
                        Send Email</Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default EmailProfessor;