import React from 'react'
import { ListGroup, ListGroupItem, Row, Col, Button } from 'react-bootstrap';
import { TopicObject } from './CourseInterfaces';
import { BsPencilSquare } from 'react-icons/bs';
import _ from 'lodash';

interface TopicsListProps {
    listOfTopics: Array<TopicObject>;
    flush?: boolean;
    showEditTopic?: _.CurriedFunction2<any, number, void>;
    removeTopic?: _.CurriedFunction2<any, number, void>;
}

/**
 * Lists topics. Clicking into one will go to the problem sets.
 */
export const TopicsList: React.FC<TopicsListProps> = ({listOfTopics, flush, showEditTopic, removeTopic}) => {
    return (
        <ListGroup variant={flush ? 'flush' : undefined}>
            {listOfTopics.map(topic => (
                <ListGroupItem key={topic.id}>
                    <Row>
                        <Col>{topic.name}</Col>
                        {showEditTopic && removeTopic && (
                            <>
                                <Col md={1}>
                                    <Button onClick={(e: any) => showEditTopic(e, topic.id)}>
                                        <BsPencilSquare/> Edit
                                    </Button>
                                </Col>
                                <Col md={1}>
                                    <Button variant='danger' onClick={(e: any) => removeTopic(e, topic.id)}>
                                        Delete
                                    </Button>
                                </Col>
                            </>
                        )}
                    </Row>
                </ListGroupItem>
            ))}
        </ListGroup>
    );
};
export default TopicsList;