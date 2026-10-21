# 0.109 — lifting Wenus

Nowy moduł `venusAtmosphere.ts` przedstawia Wenus jako nieprzezroczystą warstwę chmur: kremowe i złote fronty, szerszy ochrowy pas, delikatne zakrzywione smugi oraz trzy stylizowane wiry. To uproszczona ilustracja na podstawie referencji autora, we wspólnym płaskim stylu gry. Nie dodaje widocznych kontynentów ani kraterów powierzchni.

Wspólny `planetView('venus')` używa nowej atmosfery, zakrzywionego cienia i cienkiej chłodnej obwódki. Dotyczy mapy Układu Słonecznego, tła bazy i sektora lotu. Zachowano promień i skalę planety oraz cache statycznej grafiki. Brak nowych animacji lub obiektów tworzonych co klatkę.

Nie zmieniono rozmieszczenia sektora, misji, fizyki ani formatów zapisu (kampania 66, dziennik 29).

Weryfikacja: podgląd przeglądarkowy dużej i małej ilustracji, istniejące cztery testy warstwy planet i paralaksy, typecheck, lint zmienionych modułów i build release.
