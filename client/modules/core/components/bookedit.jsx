import forms from "newforms"
import BootstrapForm from "newforms-bootstrap"
import React from "react"
import {Button} from "react-bootstrap"
import Helmet from "react-helmet"
import {browserHistory} from "react-router"

export default React.createClass({

  form: forms.Form.extend({
    title: forms.CharField({required: false, widgetAttrs: {autoFocus: true}}),
    author: forms.CharField({required: false})
  }),

  onSubmit(e) {
    e.preventDefault()
    const form = this.refs.form.getForm()
    if(form.validate())
      this.props.onSubmit(form.cleanedData)
      .then(() => browserHistory.push(`/books/${this.props.id}`))
  },

  render() {
    const f = new this.form({initial: {title: this.props.title, author: this.props.author}})
    return <div>
      <Helmet title="Edit Metadata"/>
      <h1>Edit Metadata</h1>
      <form onSubmit={this.onSubmit}>
        <forms.RenderForm ref="form" form={f}>
          <BootstrapForm/>
        </forms.RenderForm>
        <Button type="submit">Save</Button>
        <Button onClick={() => browserHistory.push(`/books/${this.props.id}`)}>Cancel</Button>
      </form>
    </div>
  }

})
