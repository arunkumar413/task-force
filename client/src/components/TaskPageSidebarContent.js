import React, { useState } from "react"
import { useSelector } from "react-redux"
import { Labels } from "./Labels"





export function TaskPageSidebarContent() {
    // const labels= useSelector(state=>state.selectedTask.labels)
    // [selectedLabels,setSelectedLabels]= useState(labels)

    const [labels, setLabels] = useState(['bug', 'feature', 'enhancement'])
    const labelElements = labels.map(function (item, index) {
        return (
            <span className="tag primary" key={index.toString()}> {item} </span>
        )
    })

    return (
        <>
            <h3> Lables</h3>
            {labelElements}
        </>
    )
}