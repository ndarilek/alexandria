import React from "react"
import ReactDOM from "react-dom"
import {IndexRoute, Router, Route, browserHistory} from "react-router"

import Layout from "./components/layout"
import BookDisplay from "./containers/bookdisplay"
import BookEdit from "./containers/bookedit"
import Home from "./containers/home"
import Upload from "./containers/upload"

export default function(injectDeps, {browserHistory}) {

  const LayoutCtx = injectDeps(Layout)

  ReactDOM.render(<Router history={browserHistory}>
    <Route path="/" component={LayoutCtx}>
      <IndexRoute component={Home}/>
      <Route path="books/:id" component={BookDisplay}/>
      <Route path="books/:id/edit" component={BookEdit}/>
      <route path="new" component={Upload}/>
    </Route>
  </Router>, document.body)

}
