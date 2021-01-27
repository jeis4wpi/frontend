import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import SimpleFormRow from '../Components/SimpleFormRow';
import useAlertState from '../Hooks/useAlertState';
import logger from '../Utilities/Logger';
import { registerUser } from '../APIInterfaces/BackendAPI/Requests/UserRequests';
import { Constants } from '../Utilities/Constants';

interface RegisterFormProps {

}

type RegisterFormData = {
    registerEmail: string;
    registerFirstName: string;
    registerLastName: string;
    registerPassword: string;
    registerPasswordConf: string;
}

/**
 * This component renders the Render form.
 */
export const RegisterForm: React.FC<RegisterFormProps> = () => {
    const [validated, setValidated] = useState(false);
    const [{message: registrationAlertMsg, variant: registrationAlertType}, setRegistrationAlert] = useAlertState();
    const [formState, setFormState] = useState<RegisterFormData>({
        registerEmail: '', 
        registerPassword: '', 
        registerFirstName: '', 
        registerLastName: '',
        registerPasswordConf: '',
    });
    const [doPasswordsMatch, setDoPasswordsMatch] = useState<Boolean>(false);

    useEffect(() => {
        setDoPasswordsMatch(formState.registerPassword === formState.registerPasswordConf);
    }, [formState.registerPassword, formState.registerPasswordConf]);
    
    const handleNamedChange = (name: keyof RegisterFormData) => {
        return (event: any) => {
            if (name !== event.target.name) { 
                logger.error(`Mismatched event, ${name} is on ${event.target.name}`);
            }
            const val = event.target.value;
            setFormState({...formState, [name]: val});
            // On change remove error
            setRegistrationAlert({message: '', variant: 'info'});
        };
    };

    const handleRegister = async () => {
        try {
            const resp = await registerUser({
                email: formState.registerEmail,
                password: formState.registerPassword,
                firstName: formState.registerFirstName,
                lastName: formState.registerLastName,
            });

            if (resp.status !== 201) {
                logger.warn(`handleRegister: Registration succeeded however got unexpected status code ${resp.status} instead of 201`);
            }
            let message = 'You have been successfully registered.';
            if (!resp.data.data.verificationBypass) {
                message =`${message} A verification email has been sent to you. Please check your spam folder if you do not see it in your inbox.`;
            } else {
                message =`${message} Please log in.`;
            }
            setRegistrationAlert({message, variant: 'success'});

        } catch (err) {
            setRegistrationAlert({message: err.message, variant: 'danger'});
        }
    };

    const handleSubmit = (event: any) => {
        const form = event.currentTarget;
        event.preventDefault();

        if (form.checkValidity() === false) {
            event.stopPropagation();
        } else {
            if(formState.registerPassword !== formState.registerPasswordConf) {
                setRegistrationAlert({message: 'Your password did not match the confirmation.', variant: 'danger'});
            } else {
                handleRegister();
            }
        }
  
        setValidated(true);
    };

    return (
        <Form noValidate validated={validated} onSubmit={handleSubmit} action='#'>
            {(registrationAlertMsg !== '') && <Alert variant={registrationAlertType}>{registrationAlertMsg}</Alert>}
            <SimpleFormRow
                required
                id='registerFirstName'
                label='First Name'
                defaultValue='' 
                name="registerFirstName" 
                autoComplete="given-name"
                placeholder="Charles"
                errmsg="Your last name is required."
                onChange={handleNamedChange('registerFirstName')}
            />
            <SimpleFormRow
                id='registerLastName'
                label='Last Name'
                errmsg="Your last name is required."
                required
                defaultValue='' 
                name="registerLastName" 
                autoComplete="family-name"
                placeholder="Xavier"
                onChange={handleNamedChange('registerLastName')}
            />
            <SimpleFormRow
                id="registerEmail"
                label="Institutional Email Address"
                errmsg="An Institutional email address is required."
                required
                defaultValue='' 
                name="registerEmail" 
                autoComplete="email" 
                type="email" 
                placeholder="cxavier@xavierinstitute.edu"
                onChange={handleNamedChange('registerEmail')}
            />
            <SimpleFormRow 
                id="password"
                label="Password"
                errmsg="Your password must be at least 4 characters long."
                required
                defaultValue=''
                name="registerPassword" 
                autoComplete="new-password" 
                type="password" 
                onChange={handleNamedChange('registerPassword')}
                placeholder="******"
                // TODO: Minimum password requirements
                minLength={Constants.Passwords.MIN_LENGTH}
                maxLength={Constants.Passwords.MAX_LENGTH}
            />
            <SimpleFormRow
                id="registerPasswordConf"
                label="Confirm Password"
                errmsg="Passwords must match."
                required
                defaultValue=''
                name="registerPasswordConf" 
                autoComplete="new-password"
                type="password"
                onChange={handleNamedChange('registerPasswordConf')}
                placeholder="******"
                isValid={formState.registerPassword?.length > 3 && doPasswordsMatch}
            />
            <Form.Group>
                <Button type="submit" disabled={registrationAlertType === 'success'}>Submit</Button>
            </Form.Group>
        </Form>
    );
};

export default RegisterForm;