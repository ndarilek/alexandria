export default {

  create({Meteor}, fileId) {
    return Meteor.promise("books.create", fileId)
  },

  edit({Meteor}, id, args) {
    return Meteor.promise("books.editMetadata", id, args)
  },

  remove({Meteor}, id) {
    return Meteor.promise("books.remove", id)
  }

}
