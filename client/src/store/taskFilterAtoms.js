import { atom } from "recoil";

export const isLowSelected = atom({
    key: 'isLowSelected', 
    default: true, 
  });

 export const isMediumSelected= atom({
    key:'isMediumSelected',
    default: true
  })

  export const isHighSelected= atom({
    key:'isHighSelected',
    default: true
  })

  export const isUrgentSelected= atom({
    key:'isUrgentSelected',
    default: true
  })

