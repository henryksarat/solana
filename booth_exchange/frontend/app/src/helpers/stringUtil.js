function threeDotStringRepresentation(item) {
    if(item.length <= 10) {
      return item
    } else {
      let stringRepresentation = String(item)
      const finalString = stringRepresentation.substring(0, 5) 
        + "..." 
        + stringRepresentation.substring(stringRepresentation.length-5, stringRepresentation.length)
      return finalString
    }
  }

  export {threeDotStringRepresentation}