import {useDeps, composeWithTracker, composeAll} from "mantra-core"

import BookList from "../components/booklist"

import {Books} from "/lib/collections"
import {hasPermission} from "../libs/sandstorm"

const composer = ({context}, onData) => {
  const {Meteor} = context()
  if(Meteor.subscribe("books").ready()) {
    const books = Books.find({}, {sort: {"metadata.user.title": 1, "metadata.original.dc:title": 1, "files.uploadFilename": 1}}).fetch()
    onData(null, {
      books,
      canUpload: hasPermission("modify"),
      canRemove: hasPermission("modify")
    })
  }
}

const depsMapper = (context, actions) => ({
  remove: actions.books.remove,
  context: () => context
})

export default composeAll(
  composeWithTracker(composer),
  useDeps(depsMapper)
)(BookList)
