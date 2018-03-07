# node-pg-blitz
The goal of this library is to provide a pattern for creating fast and reliable integration testing (ie: testing
that requires use of a database). This library is starting with postgres as the test database, but many of
its concepts could be applied to other database engines
 
 
## Concepts 
Using a couple core concepts we can make some very fast tests.

- __Dataset__: If the programmer defines their data upfront as __datasets__ we can optimize duplicating
this data for tests

- __Instance__: When a test runs an instance from that dataset will be created. At the moment, an instance is
implemented via a postgres schema

