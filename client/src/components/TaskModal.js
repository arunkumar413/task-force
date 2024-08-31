// Modal as a separate component
import { useEffect, useRef, useState } from "react";
import Markdown from 'react-markdown'


export function TaskModal({ isModalOpen, closeModal, selectedTask }) {

    const [comments, setComments] = useState([{
        comment: "### Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        commentedBy: 'Arun',
        date: new Date().toLocaleString()
    },

    {
        comment: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        commentedBy: 'Arun',
        date: new Date().toLocaleString()

    },
    {
        comment: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        commentedBy: 'Arun',
        date: new Date().toLocaleString()

    },
    {
        comment: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        commentedBy: 'Arun',
        date: new Date().toLocaleString()

    }
    ])
    const ref = useRef();

    useEffect(() => {
        if (isModalOpen) {
            ref.current?.showModal();
        } else {
            ref.current?.close();
        }
    }, [isModalOpen]);


    const commentElements = comments.map(function (item, index) {

        return (
            <div key={index.toString()} className="comment-item">
                <Markdown>{item.comment}</Markdown>
                {/* <p>{item.comment}</p> */}

            </div>
        )
    })

    return (
        <dialog className="task-modal" ref={ref} onCancel={closeModal}>
            <div className="selected-task-modal-header">
                <h2> {selectedTask.title}</h2>
                <div className='username-box' style={{ display: 'flex', justifyContet: 'center', flexDirection: 'row', alignItems: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-user">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <p>  {selectedTask.user}</p>
                </div>
                <div className='task-status-box' style={{ display: 'flex', justifyContet: 'center', flexDirection: 'row', alignItems: 'center' }}>

                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-list-todo"><rect x="3" y="5" width="6" height="6" rx="1" /><path d="m3 17 2 2 4-4" />
                        <path d="M13 6h8" /><path d="M13 12h8" /><path d="M13 18h8" /></svg>
                    <p>  {selectedTask.status}</p>
                </div>
                <p>  {selectedTask.priority}</p>
            </div>

            <div className="selected-task-modal-body">
                <p className="task-description">
                    {selectedTask.description}
                </p>

                <div className="selected-task-modal-comments-container">
                    {commentElements}
                    <textarea placeholder="Enter your comments here" rows={5} cols={100} />
                    <button> Add comment </button>

                </div>
            </div>

            <div className="selected-task-modal-footer">
                <div></div>
                <div></div>
                <div></div>
                <button className="button-close" onClick={closeModal}> Close </button>
            </div>
        </dialog>
    );
}
