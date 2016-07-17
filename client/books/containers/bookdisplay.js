import {Meteor} from "meteor/meteor"
import {createContainer} from "meteor/react-meteor-data"
import {connect} from "react-redux"

import BookDisplay from "../components/bookdisplay"

import {Books} from "/lib/collections"
import {title} from "/client/lib/book"
import {hasPermission} from "/client/lib/sandstorm"

const mapStateToProps = (state, props) => {
  const book = state.books.find((b) => b._id == props.params.id)
  let ttl = title(book)
  if(!ttl)
    ttl = "Loading..."
  return {
    book,
    title: ttl
  }
}

const mergeProps = (stateProps, dispatchProps, props) => ({
  ...stateProps,
  ...dispatchProps,
  id: props.params.id,
  ...props
})

export default createContainer((props) => {
  const handle = Meteor.subscribe("books")
  const canDownload = hasPermission("download")
  const canEditMetadata = hasPermission("modify")
  return {
    ready: handle.ready(),
    canDownload,
    canEditMetadata
  }
}, connect(
  mapStateToProps,
  undefined,
  mergeProps
)(BookDisplay))
