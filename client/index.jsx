import "jquery/dist/jquery.js"
import React from "react"
import {render} from "react-dom"
import {Provider} from "react-redux"
import {IndexRoute, Router, Route, browserHistory} from "react-router"
import {routerMiddleware, routerReducer, syncHistoryWithStore} from "react-router-redux"
import {applyMiddleware, combineReducers, createStore} from "redux"
import promise from "redux-promise"

import {syncBookmarks, updateBookPosition} from "./bookmarks"
import {bookmarksReducer, selectedBookmarkReducer} from "./bookmarks/actions"
import {reducer as booksReducer} from "./books/actions"
import Home from "./containers/home"
import {BookDisplay, BookEdit, Upload, syncBooks} from "./books"
import Layout from "./components/layout"
import "./style.css"

const store = createStore(
  combineReducers({
    bookmarks: bookmarksReducer,
    books: booksReducer,
    routing: routerReducer,
    selectedBookmark: selectedBookmarkReducer
  }),
  applyMiddleware(
    promise,
    routerMiddleware(browserHistory)
  )
)

const history = syncHistoryWithStore(browserHistory, store)

Meteor.startup(() => {
  updateBookPosition(store)
  syncBookmarks(store)
  syncBooks(store)
  render(
    <Provider store={store}>
      <Router history={history}>
        <Route path="/" component={Layout}>
          <IndexRoute component={Home}/>
          <Route path="books/:id" component={BookDisplay}/>
          <Route path="books/:id/edit" component={BookEdit}/>
          <route path="new" component={Upload}/>
        </Route>
      </Router>
    </Provider>
  , document.body)
})
