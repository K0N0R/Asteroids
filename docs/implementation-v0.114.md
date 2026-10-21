# 0.114 — lifting Neptuna

`neptuneAtmosphere.ts` zastępuje proste paski i pojedynczą ciemną elipsę nową statyczną ilustracją atmosfery. Obejmuje głęboki kobalt, zróżnicowane błękitne warstwy, jasne wąskie smugi z nierównymi krawędziami, mniejszy północny wir i większy kompleks burzowy z ciemnym środkiem. Jasne chmury wyginają się wokół burzy i przechodzą w asymetryczny ślad. Glob otrzymał zakrzywioną granicę cienia.

To stylizowana interpretacja referencji autora w języku płaskich ilustracji gry, nie dokładny atlas aktualnej atmosfery. `planetView('neptune')` stosuje grafikę na mapie Układu Słonecznego, w bazie oraz podczas lotu. Zachowano promień, położenie, paralaksę i cache statycznej ilustracji. Brak nowych obiektów tworzonych co klatkę oraz zmian misji, fizyki i zapisów (kampania 66, dziennik 29).

Weryfikacja: duży i mały podgląd przeglądarkowy, kontrola renderowania warstw chmur, cztery istniejące testy planet i paralaksy, typecheck, lint zmienionych modułów i build release.
