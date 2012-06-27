from StringIO import StringIO
from Products.CMFCore.utils import getToolByName

def uninstall( self ):
    out = StringIO()
    portal_setup = getToolByName(self, 'portal_setup')
    portal_setup.runAllImportStepsFromProfile('profile-Solgema.NavigationPortlet:uninstall')
    print >> out, "Removing Solgema NavigationPortlet"
    return out.getvalue()
