import {Meteor} from "meteor/meteor"
import {createContainer} from "meteor/react-meteor-data"
import {connect} from "react-redux"

import {edit} from "../actions"
import BookEdit from "../components/bookedit"

import {Books} from "/lib/collections"
import {author, title} from "/client/lib/book"

const mapStateToProps = (state, props) => {
  const id = props.id
  const book = state.books.find((v) => v._id == id)
  return {
    title: title(book),
    author: author(book)
  }
}

const mapDispatchToProps = (dispatch, {id}) => ({
  edit: (args) => dispatch(edit(id, args))
})

export default createContainer((props) => {
  const handle = Meteor.subscribe("books")
  return {
    id: props.params.id,
    ready: handle.ready()
  }
}, connect(
  mapStateToProps,
  mapDispatchToProps
)(BookEdit))
