import React from "react";
import { useLocation, useMatch } from 'react-router-dom';
import { Link } from "react-router-dom";
import { HomeSideBarContent } from "./HomeSideBarContent";
import { TaskPageSidebarContent } from "./TaskPageSidebarContent";



export function Sidebar() {
    const location = useLocation();
    const matchTaskId = useMatch('/task/:task_id')
    const matchHome = useMatch('/')

    function getSelectedSidebarContent() {
        if (matchHome) {
            return <HomeSideBarContent />
        }
        else if (matchTaskId) {
            return <TaskPageSidebarContent/>
        }
    }


    return (
        <aside className="Sidebar" style={{ paddingLeft: "1rem" }}>
          {getSelectedSidebarContent()}
        </aside>
    )
}