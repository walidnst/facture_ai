from django.urls import path
from .views import (
    test_api, upload_facture, validate_facture,
    get_ecritures, liste_factures,
    export_pdf, export_excel, export_excel_all
)

urlpatterns = [
    path('', test_api),
    path('upload/', upload_facture),
    path('validate/', validate_facture),
    path('ecritures/<int:facture_id>/', get_ecritures),
    path('factures/', liste_factures),
    path('export/pdf/<int:facture_id>/',   export_pdf),
    path('export/excel/<int:facture_id>/', export_excel),
    path('export/excel-all/',              export_excel_all),
]







