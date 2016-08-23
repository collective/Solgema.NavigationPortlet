from plone.portlets.utils import unregisterPortletType
from zope.component import adapter, getUtility, getAdapters, getMultiAdapter
from Products.CMFCore.utils import getToolByName
from Products.CMFPlone.utils import getFSVersionTuple
from plone.portlets.interfaces import IPortletAssignmentMapping
from plone.portlets.interfaces import IPortletManager
from Products.GenericSetup.interfaces import IProfileImportedEvent

def installSolgemaNavigationPortlet(context):
    if context.readDataFile('solgemanavigationportlet_install.txt') is None:
        return
    site = context.getSite()

    setup = getToolByName(site, 'portal_setup')
    if getFSVersionTuple()[0] == 4:
        setup.runAllImportStepsFromProfile('profile-Solgema.NavigationPortlet:plone4')
    else:
        setup.runAllImportStepsFromProfile('profile-Solgema.NavigationPortlet:plone5')

def uninstallSolgemaNavigationPortlet(context):
    if context.readDataFile('solgemanavigationportlet_uninstall.txt') is None:
        return
    site = context.getSite()
    out = StringIO()
    sm = site.getSiteManager()

@adapter(IProfileImportedEvent)
def handleProfileImportedEvent(event):
    context = event.tool
    if 'to500' in event.profile_id and event.full_import:
        portal_setup = getToolByName(context, 'portal_setup')
        portal_setup.runAllImportStepsFromProfile('profile-Solgema.NavigationPortlet:uninstallplone4')
        portal_setup.runAllImportStepsFromProfile('profile-Solgema.NavigationPortlet:plone5')
