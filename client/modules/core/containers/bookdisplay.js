import {useDeps, composeWithTracker, composeAll} from "mantra-core"

import BookDisplay from "../components/bookdisplay"

import {Books} from "/lib/collections"
import {title} from "../libs/book"
import {hasPermission} from "../libs/sandstorm"

const composer = ({context, params}, onData) => {
  const {Meteor} = context()
  if(Meteor.subscribe("books").ready()) {
    const id = params.id
    const book = Books.findOne(id)
    const canDownload = hasPermission("download")
    const canEditMetadata = hasPermission("modify")
    let ttl = title(book)
    if(!ttl)
      ttl = "Loading..."
    onData(null, {id, title: ttl, canDownload, canEditMetadata})
  }
}

export default composeAll(
  composeWithTracker(composer),
  useDeps()
)(BookDisplay)
