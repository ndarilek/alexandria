export default {

  create({Meteor}, bookId, name) {
    return Meteor.promise("bookmarks.create", bookId, name)
  },

  update({Meteor}, id, data) {
    return Meteor.promise("bookmarks.update", id, data)
  },

  remove({Meteor}, id) {
    return Meteor.promise("bookmarks.remove", id)
  }

}
