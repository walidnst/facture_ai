from django.db import models
from django.db import models

class Facture(models.Model):
    file = models.FileField(upload_to='factures/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    ocr_text = models.TextField(null=True, blank=True)
    fournisseur = models.CharField(max_length=255, null=True, blank=True)
    date = models.CharField(max_length=100, null=True, blank=True)
    total = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.file.name