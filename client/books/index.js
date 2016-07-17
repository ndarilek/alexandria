import {Tracker} from "meteor/tracker"

import {Books} from "/lib/collections"
import {set} from "./actions"
import BookDisplay from "./containers/bookdisplay"
import BookEdit from "./containers/bookedit"
import BookList from "./containers/booklist"
import Upload from "./containers/upload"
import {reducer} from "./actions"

export {
  BookDisplay,
  BookEdit,
  BookList,
  reducer,
  Upload
}

export const syncBooks = (store) => {
  Tracker.autorun(() => store.dispatch(set(Books.find().fetch())))
}
