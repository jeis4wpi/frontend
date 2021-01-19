import React, { useContext, useEffect, useState } from 'react';
import { UserObject } from '../CourseInterfaces';
import { Link } from 'react-router-dom';
import EmailModal from './EmailModal';
import { UserRole, getUserRole } from '../../Enums/UserRole';
import { Email } from '@material-ui/icons';
import _ from 'lodash';
import MaterialTable from 'material-table';
import { TiUserDelete } from 'react-icons/ti';
import { MdLaunch } from 'react-icons/md';
import MaterialIcons from '../../Components/MaterialIcons';
import { deleteEnrollment } from '../../APIInterfaces/BackendAPI/Requests/CourseRequests';
import { ConfirmationModal } from '../../Components/ConfirmationModal';
import { useCourseContext } from '../../Courses/CourseProvider';
import logger from '../../Utilities/Logger';

interface EmailComponentWrapperProps {
    users: Array<UserObject>;
}

/**
 * This component manages the state for the Email Students functionality.
 */
export const EmailComponentWrapper: React.FC<EmailComponentWrapperProps> = ({ users: propUsers }) => {
    const {course, users, setUsers} = useCourseContext();
    const [selectedStudents, setSelectedStudents] = useState<UserObject[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState<{state: boolean, user: UserObject | null}>({state: false, user: null});
    const userType: UserRole = getUserRole();

    const onDropStudent = (userId: number, courseId: number) => {
        try {
            deleteEnrollment({userId, courseId});
            setUsers?.(_.filter(users, user => user.id !== userId));
        } catch (e) {
            // TODO: display errors to user.
            logger.error('Drop student failed', e);
        }
    };
    
    return (
        <>
            <EmailModal show={showModal} setClose={() => setShowModal(false)} users={selectedStudents} />
            <ConfirmationModal 
                show={showConfirmDelete.state}
                onHide={() => setShowConfirmDelete({state: false, user: null})}
                onConfirm={() => {
                    if (_.isNull(showConfirmDelete.user)) {
                        logger.error('Tried deleting a null user!');
                        return;
                    }
                    onDropStudent(showConfirmDelete.user.id, course.id);
                    setShowConfirmDelete({state: false, user: null});
                }}
                confirmText={`Drop ${showConfirmDelete.user?.firstName} from ${course.sectionCode}`}
                confirmVariant='danger'
                headerContent={<h4>Drop Student</h4>}
                bodyContent={(
                    <div className='text-center'>
                        <p>Are you sure you want to drop <br/>
                            <b>{showConfirmDelete.user?.firstName} {showConfirmDelete.user?.lastName}</b><br/>
                        from the course <br/>
                            <b>{course.sectionCode} {course.semesterCode}{course.semesterCodeYear}</b>?</p>
                        <p>This action cannot be undone.</p>
                    </div>
                )}
            />
            <div style={{maxWidth: '100%'}}>
                <MaterialTable
                    icons={MaterialIcons}
                    title={course.name}
                    columns={[
                        {title: 'First Name', field: 'firstName'},
                        {title: 'Last Name', field: 'lastName'},
                    ]}
                    data={users}
                    // onRowClick={(e: any, user: any) => onClickStudent(user.id)}
                    onSelectionChange={(rows: UserObject[]) => setSelectedStudents(rows)}
                    options={{
                        exportButton: userType !== UserRole.STUDENT,
                        exportAllData: true,
                        actionsColumnIndex: -1,
                        rowStyle: unit => ({
                            backgroundColor: _.includes(selectedStudents, unit.id) ? '#EEE' : '#FFF'
                        }),
                        pageSize: 10,
                        pageSizeOptions: [10, 15, 20],
                        selection: userType !== UserRole.STUDENT,
                        showTextRowsSelected: false,
                        emptyRowsWhenPaging: false,
                    }}
                    actions={userType !== UserRole.STUDENT ? [
                        {
                            // eslint-disable-next-line react/display-name
                            icon: () => <TiUserDelete style={{color: 'red'}} />,
                            tooltip: 'Drop student from course',
                            onClick: (_event: any, user: any) => setShowConfirmDelete({state: true, user}),
                            position: 'row'
                        },
                        {
                            // eslint-disable-next-line react/display-name
                            icon: () => <Link to={(loc: any) => ({...loc, pathname: `${loc.pathname}/settings`})}><MdLaunch style={{color: 'black'}} /></Link>,
                            tooltip: 'Go to Extensions',
                            onClick: () => null,
                            position: 'row'
                        },
                        {
                            // eslint-disable-next-line react/display-name
                            icon: () => <span><Email style={{color: '#007bff'}}/> Email</span>,
                            // isFreeAction: true,
                            tooltip: 'Email selected students',
                            onClick: () => setShowModal(true),
                            position: 'toolbarOnSelect'
                        }
                    ] : undefined}
                    localization={{header: { actions: 'Actions'}}}
                />
            </div>
        </>
    );
};

export default EmailComponentWrapper;