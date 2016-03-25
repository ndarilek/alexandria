import {useDeps, composeWithTracker, composeAll} from "mantra-core"

import BookEdit from "../components/bookedit"

import {Books} from "/lib/collections"
import {author, title} from "../libs/book"

const composer = ({context, params}, onData) => {
  const {Meteor} = context()
  if(Meteor.subscribe("books").ready()) {
    const id = params.id
    const book = Books.findOne(id)
    onData(null, {
      id,
      title: title(book),
      author: author(book)
    })
  }
}

const depsMapper = (context, actions) => ({
  edit: actions.books.edit,
  context: () => context
})

export default composeAll(
  composeWithTracker(composer),
  useDeps(depsMapper)
)(BookEdit)
