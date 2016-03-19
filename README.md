# Alexandria

Read books in [Sandstorm](https://sandstorm.io)!

## Warning

This is pre-release. I'm working to develop a reasonably future-proof schema so that Alexandria can become the place you read and store all your ebooks, and the originals are preserved while conversions are upgraded as needed. We aren't there yet though, so don't use this on any content you aren't willing to delete and re-upload.

Also, as of now this is a learning project for me. I've never used CollectionFS and needed something to experiment with. That isn't to say this code will always be crap, but there are definite areas for improvement--upload progress, for instance. I'll remove this when I feel it's no longer true.

Finally, it isn't yet secure. Sandstorm roles and permissions are partially integrated, but anyone can still modify/delete book content on the server. There is a possible workaround for this, and I'll remove this paragraph once I'm confident it works.

## Building

### Testing/Development

First, [download Calibre](http://calibre-ebook.com/download). Alexandria expects to find the `ebook-convert` binary in your path. Note that I've only tested this under Linux, and can't say whether it will work anywhere else.

Then, [install meteor](https://www.meteor.com/install). Once complete:

```
meteor
```

Find the app at http://localhost:3000/. See the [accounts-sandstorm docs](https://github.com/sandstorm-io/meteor-accounts-sandstorm) for instructions on how to activate various account permissions. Currently `modify` is needed to upload, edit and remove books, and `download` is necessary to download originals.

### Production

With [vagrant-spk installed](https://docs.sandstorm.io/en/latest/vagrant-spk/installation/), run:

```
vagrant-spk vm up
vagrant-spk dev
<ctrl-c>
vagrant-spk pack alexandria.spk
```

Upload the resulting `.spk> file to your Sandstorm server and get ready to curl up with a good book!
