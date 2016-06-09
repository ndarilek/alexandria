export const hasPermission = (permission) => {
  if(Meteor.sandstormUser && Meteor.sandstormUser().permissions)
    return Meteor.sandstormUser().permissions.indexOf(permission) != -1
  else
    return false
}


