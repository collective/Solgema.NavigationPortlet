from plone.app.upgrade.utils import loadMigrationProfile

def upgrade11(context):
    loadMigrationProfile(context, 'profile-Solgema.NavigationPortlet:default', steps=('jsregistry',))
