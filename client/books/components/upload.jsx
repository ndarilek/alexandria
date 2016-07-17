import React from "react"
import {Navbar} from "react-bootstrap"
import Helmet from "react-helmet"
import {Link, browserHistory} from "react-router"

import {Uploads} from "/lib/collections"

export default class extends React.Component {

  componentDidMount() {
    Uploads.resumable.assignBrowse(this.refs.file)
    Uploads.resumable.on("fileAdded", this.fileAdded.bind(this))
    Uploads.resumable.on("progress", (progress) => this.setState({progress}))
  }

  fileAdded(file) {
    this.props.fileAdded(file)
    .then((action) => this.props.create(action.payload))
    .then((action) => {
      console.log("id", action)
      browserHistory.push(`/books/${action.payload}`)
    })
  }

  render() {
    if(this.state && this.state.converting)
      return <div>
        <h1>Converting...</h1>
      </div>
    else if(this.state && this.state.progress != null)
      return <div>
        <Helmet title="Uploading"/>
        <h1>Uploading...</h1>
        <progress value={this.state.progress}/>
      </div>
    else
      return <div>
        <Helmet title="Upload Book"/>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand><Link to="/">Alexandria</Link></Navbar.Brand>
          </Navbar.Header>
        </Navbar>
        <h1>Upload Book</h1>
        <input type="file" ref="file"/>
      </div>
  }

}
