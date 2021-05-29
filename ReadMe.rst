Subcomponents in Trac
=====================

Version 1.4 of this plugin is developed for and tested on Trac 1.5 and 1.6.
There are older, unmaintained, versions for Trac 1.2, 1.0, 0.12 and Trac 0.11.

What is it?
-----------

This plugin alters Trac's behavior so that the interface supports multiple 
layers of components. In project with lots of components, rearranging these
components into several layers can clear up the list of components. 

What is it not?
---------------

The component does not change the data model of the components; it merely
manipulates the user interface. So a component ``Web`` with the subcomponents
``Backend`` and ``Frontend`` will be stored in the database as ``Web/Backend``
and ``Web/Frontend``.

Installation
------------

To install the module see the TracPlugins page on
http://trac.edgewall.org/wiki/TracPlugins. After activating the plugin in 
the configuration file or through the plugins page, it will be activated
without any further configuration.

Using subcomponents
-------------------

To create components with subcomponents, then you have to add these using the
standard component admin page. If you enter the following components:

* ``Web``
* ``Web/Frontend``
* ``Web/Backend``

Then the user interface will show the ``Frontend`` and ``Backend`` as a
subcomponent of the ``Web`` component.  