- UI display name: techhala-ldap
- Vendor: Active Directory
- Connection URL: ldap://openldap:389
- Bind Type: simple
- Bind DN: cn=admin,dc=techhala,dc=com
- Bind credentials: admin_password
- Edit mode: READ_ONLY
- Users DN: ou=users,dc=techhala,dc=com
- Username LDAP attribute: uid
- RDN LDAP attribute: uid
- UUID LDAP attribute: entryUUID
- User object classes: inetOrgPerson


## Mappers
- groups
  - LDAP Groups DN: ou=groups,dc=techhala,dc=com
  - Group Name LDAP Attribute: cn
  - Group Object Classes: groupOfUniqueNames
  - Membership LDAP Attribute: uniqueMember
  - Membership Attribute Type: DN
  - Membership User LDAP Attribute: uid
  - Mode: READ_ONLY
  - User Groups Retrieve Strategy: GET_GROUPS_FROM_USER_MEMBEROF_ATTRIBUTE
  - Member-Of LDAP Attribute: memberOf
