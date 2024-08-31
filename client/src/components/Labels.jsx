import React, { useState } from "react";


export function Labels({ selectedLabels, setSelectedLabels }) {
    const [labels, setLabels] = useState(["development", "testing", 'documentation', "UI/UX",'frontend','backend'])
    // const [selectedLabels, setSelectedLabels] = useState([])

    function toggleLabel(evt) {
        let clickedLabel = evt.target.name
        if (selectedLabels.includes(clickedLabel)) {
            let temp = selectedLabels.filter(function (item, index) {
                return clickedLabel !== item
            })
            setSelectedLabels(temp)
        }

        else {
            setSelectedLabels(function (prevState) {
                return [...prevState, clickedLabel]
            })

        }
    }


    function addClass(item) {
        if (selectedLabels.includes(item)) {
            return "btn small filled success"
        }

        else {
            return "btn small outlined success"
        }
    }


    const labelElements = labels.map(function (item, index) {
        return <button style={{ textAlign: "center" }} name={item} onClick={toggleLabel} key={index.toString()} className={addClass(item)}> {item}
            {selectedLabels.includes(item) ?
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5" /></svg> : ""
            }
        </button>
    })


    return (
        <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }} className="Labels">
            {labelElements}
        </div>
    )
}