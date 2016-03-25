import {Mongo} from "meteor/mongo"

export const Bookmarks = new Mongo.Collection("bookmarks")
export const Books = new Mongo.Collection("books")
export const Uploads = new FileCollection("uploads", {resumable: true})
