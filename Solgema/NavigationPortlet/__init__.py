from Products.CMFCore import DirectoryView

GLOBALS = globals()

DirectoryView.registerDirectory('skins', GLOBALS)

PROJECTNAME = "Solgema.NavigationPortlet"

def initialize(context):
    """Initializer called when used as a Zope 2 product."""
    # Initialize content types
