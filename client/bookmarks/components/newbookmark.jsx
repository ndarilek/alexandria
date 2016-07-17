import forms from "newforms"
import BootstrapForm from "newforms-bootstrap"
import React from "react"
import {Button, Modal} from "react-bootstrap"

export default React.createClass({

  form: forms.Form.extend({
    name: forms.CharField({widgetAttrs: {autoFocus: true}})
  }),

  onSubmit(e) {
    e.preventDefault()
    const form = this.refs.form.getForm()
    if(form.validate())
      this.props.onSubmit(form.cleanedData)
      .then(() => this.props.close())
  },

  render() {
    return <Modal show={this.props.show}>
      <Modal.Header closeButton>
        <Modal.Title>New Bookmark</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={this.onSubmit}>
          <forms.RenderForm ref="form" form={this.form}>
            <BootstrapForm/>
          </forms.RenderForm>
          <Button type="submit">Create</Button>
          <Button onClick={this.props.close}>Cancel</Button>
        </form>
      </Modal.Body>
    </Modal>
  }

})
