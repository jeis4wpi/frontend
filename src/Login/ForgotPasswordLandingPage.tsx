import React, { useState } from 'react';
import { Form, Button, Alert, Jumbotron } from 'react-bootstrap';
import { useParams } from 'react-router';
import SimpleFormRow from '../Components/SimpleFormRow';
import useAlertState from '../Hooks/useAlertState';
import { putUpdateForgottonPassword } from '../APIInterfaces/BackendAPI/Requests/UserRequests';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import logger from '../Utilities/Logger';
import LandingPageWrapper from '../Components/LandingPageWrapper';
import { Constants } from '../Utilities/Constants';

interface ForgotPasswordLandingPageProps {

}

type ForgotPasswordFormData = {
    email: string;
    password: string;
    passwordConf: string;
}

// TODO: Use Axios.Request JSX to selectively render success or failure.
export const ForgotPasswordLandingPage: React.FC<ForgotPasswordLandingPageProps> = () => {
    const { uid } = useParams<{uid?: string}>();
    const [formState, setFormState] = useState<ForgotPasswordFormData>({
        email: '',
        password: '',
        passwordConf: '',
    });
    const [validated, setValidated] = useState(false);
    const [success, setSuccess] = useState(false);
    const [{ message: forgotPasswordAlertMsg, variant: forgotPasswordAlertType }, setForgotPasswordAlert] = useAlertState();

    const handleForgotPassword = async () => {
        try {
            if(_.isNil(uid)) {
                logger.error('The router should not allow for null uid');
                throw new Error('Cannot reset password with token!');
            }
            await putUpdateForgottonPassword({
                email: formState.email,
                newPassword: formState.password,
                forgotPasswordToken: uid
            });
            setForgotPasswordAlert({
                message: '',
                variant: 'info'
            });
            setSuccess(true);
        } catch (e) {
            setForgotPasswordAlert({
                message: e.message,
                variant: 'danger'
            });
        }
    };

    const handleSubmit = (event: any) => {
        const form = event.currentTarget;
        event.preventDefault();

        if (form.checkValidity() === false) {
            event.stopPropagation();
        } else {
            if (formState.password !== formState.passwordConf) {
                setForgotPasswordAlert({
                    message: 'Your password did not match the confirmation.',
                    variant: 'danger'
                });
            } else {
                handleForgotPassword();
            }
        }

        setValidated(true);
    };

    const handleNamedChange = (name: keyof ForgotPasswordFormData) => {
        return (event: any) => {
            if (name !== event.target.name) {
                logger.error(`Mismatched event, ${name} is on ${event.target.name}`);
            }
            const val = event.target.value;
            setFormState({
                ...formState,
                [name]: val
            });
            // Remove the error
            setForgotPasswordAlert({
                message: '',
                variant: 'info'
            });    
        };
    };

    // TODO: Redirect back to home after timeout?
    if (!uid) return <div>This page is no longer valid.</div>;

    if(success) {
        return (
            <Jumbotron>
                <h3>Forgot Password</h3>
                <h4>Your password has been updated!</h4>
                <h2>Please <Link to='/'>click here</Link> to login and continue your learning journey!</h2>
            </Jumbotron>
        );    
    }

    return (
        <LandingPageWrapper>
            <h1>Forgot Password</h1>
            <Form noValidate validated={validated} onSubmit={handleSubmit} action='#'>
                {(forgotPasswordAlertMsg !== '') && <Alert variant={forgotPasswordAlertType}>{forgotPasswordAlertMsg}</Alert>}
                <SimpleFormRow
                    id="email"
                    label="Institutional Email Address"
                    errmsg="An Institutional email address is required."
                    required
                    defaultValue=''
                    name="email"
                    autoComplete="email"
                    type="email"
                    onChange={handleNamedChange('email')}
                    placeholder="cxavier@xavierinstitute.edu"
                />
                <SimpleFormRow
                    id="password"
                    label="New Password"
                    errmsg="Your password must be at least 4 characters long."
                    required
                    defaultValue=''
                    name="password"
                    autoComplete="new-password"
                    type="password"
                    onChange={handleNamedChange('password')}
                    placeholder="******"
                    // TODO: Minimum password requirements
                    minLength={Constants.Passwords.MIN_LENGTH}
                    maxLength={Constants.Passwords.MAX_LENGTH}
                />
                <SimpleFormRow
                    id="password"
                    label="Confirm New Password"
                    errmsg="Your password must be at least 4 characters long."
                    required
                    defaultValue=''
                    name="passwordConf"
                    autoComplete="new-password"
                    type="password"
                    onChange={handleNamedChange('passwordConf')}
                    placeholder="******"
                />
                <Form.Group>
                    <Button type="submit" disabled={forgotPasswordAlertType === 'success'}>Submit</Button>
                </Form.Group>
            </Form>
        </LandingPageWrapper>
    );
};
    
export default ForgotPasswordLandingPage;