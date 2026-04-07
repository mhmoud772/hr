class AnalyticalRouter:
    """
    A router to control all database operations on models in the
    reports application.
    """
    route_app_labels = {'reports'}

    def db_for_read(self, model, **hints):
        """
        Attempts to read reports models go to analytical.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'analytical'
        return None

    def db_for_write(self, model, **hints):
        """
        Attempts to write reports models go to analytical.
        """
        if model._meta.app_label in self.route_app_labels:
            return 'analytical'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if a model in the reports app is involved.
        No relations across databases will be allowed.
        """
        if (
            obj1._meta.app_label in self.route_app_labels or
            obj2._meta.app_label in self.route_app_labels
        ):
           return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure the reports app only appears in the 'analytical'
        database. All other apps stay in 'default'.
        """
        if app_label in self.route_app_labels:
            return db == 'analytical'
        return db == 'default'
