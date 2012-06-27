from plone.portlets.utils import unregisterPortletType
from zope.component import getUtility, getAdapters
from zope.component import getMultiAdapter
from plone.portlets.interfaces import IPortletAssignmentMapping
from plone.portlets.interfaces import IPortletManager

def uninstallSolgemaNavigationPortlet(context):
    if context.readDataFile('solgemanavigationportlet_uninstall.txt') is None:
        return
    site = context.getSite()
