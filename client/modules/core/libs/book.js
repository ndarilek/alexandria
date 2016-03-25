export const title = (book) => {
  if(book.metadata)
    if(book.metadata.user && book.metadata.user.title)
      return book.metadata.user.title
    else if(book.metadata.original && book.metadata.original["dc:title"])
      return book.metadata.original["dc:title"]
    else
      return book.files.uploadFilename
  else
    return book.files.uploadFilename
}

export const author = (book) => {
  if(book.metadata)
    if(book.metadata.user && book.metadata.user.author)
      return book.metadata.user.author
    else if(book.metadata.original && book.metadata.original["dc:creator"] && book.metadata.original["dc:creator"].char)
      return book.metadata.original["dc:creator"].char
}
