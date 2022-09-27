function threeDotStringRepresentation(item) {
    if(item.length <= 5) {
      return item
    }
    let stringRepresentation = String(item)
    const finalString = stringRepresentation.substring(0, 5) 
      + "..." 
      + stringRepresentation.substring(stringRepresentation.length-5, stringRepresentation.length)
    return finalString
  }

  export {threeDotStringRepresentation}