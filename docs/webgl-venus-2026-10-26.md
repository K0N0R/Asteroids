# Wenus: utrata kontekstu i poprawka obsługi rozmiaru okna

Raport gracza z 26 października, `2026-10-26T11:03:21.201Z`: Chrome 155, Windows, ANGLE D3D11, RTX 2080. Kontekst wrócił po około 1024 ms.

## Co rzeczywiście wynika z raportu

- Przed błędem obszar instalacji SI pozostaje aktywny. Liczba obiektów wraca po walce do 872; tekstury rosną tylko ze 134 do 140, szacunek RGBA8 z 31,5 do 31,7 MB. Nie widać lawinowego przyrostu sceny ani tekstur.
- Sterta JS jest sprzątana, a FPS utrzymuje się w okolicy 143–145. To nie wyklucza problemu zasobów GPU, zwłaszcza buforów i renderbufferów, których poprzedni raport nie liczył.
- Dokładnie przy utracie kontekstu pojawia się zmiana viewportu 1920×911 → 1920×1080 → 1920×911. To silny trop do sprawdzenia, nie dowód awarii konkretnej funkcji terminala.
- Brak zdarzeń błędu JS i odrzucenia Promise. `statusMessage` jest pusty. Stos zapisany w raporcie pochodzi z obsługi zdarzenia utraty, nie ze sterownika GPU.

## Zmiana kodu

Domyślny ResizePlugin Pixi wykonywał `renderer.resize()` i natychmiast `app.render()` przy resize, również niezależnie od zatrzymanego tickera. Core przejmuje teraz resize przez StableViewportResize: 120 ms na ustalenie wymiarów, pomijanie identycznych rozmiarów, blokada podczas utraty GL i ukrycia dokumentu. Rendering pozostaje zadaniem tickera. Po odzyskaniu GL trafia do niego tylko ostatni oczekujący rozmiar. Montowane kontenery dostają układ również wtedy, gdy wymiary bufora się nie zmieniły.

Raport zawiera teraz liczbę i szacowany rozmiar buforów Pixi, rozmiar viewportu obok rozmiaru canvasu, ślady żądań i zatwierdzeń resize oraz aktywacji terminali i niszczenia wrogów Wenus. Diagnostyka nie wykonuje dodatkowych wywołań GL i nie przechowuje obiektów sceny.

## Sprawdzenie

- Pełny przelot aktu w przeglądarce, z walką i ponownym użyciem terminala: sześć zadań, trzy dokowania, poprawny zapis, brak błędów.
- Dwadzieścia zmian rozmiaru bufora podczas przelotu oraz viewporty 1920×911 i 1920×1080: brak spontanicznej utraty kontekstu w tej próbie.
- Wymuszona utrata podczas resize w scenie strażnika: oczekujące resize wstrzymane, po odzyskaniu zastosowany ostatni rozmiar; raport `restored: true`, około 1022 ms. To potwierdza bezpieczne odzyskiwanie, nie ustalenie źródła pierwotnego resetu sterownika.
- Dane z przeglądarki: `dist/qa-venus-descent/`.
- Bieżący zestaw związany ze zmianą: 57/57 testów (Wenus, zejście i powrót, zegar komunikatów, resize, wejście, pamięć renderera i Kepler), typecheck oraz lint zmienionych plików zaliczone.

Szerszy zestaw testów obejmujący stare scenariusze Księżyca i wyposażenia ma 14 niepowodzeń. Powtórzenie tych samych testów z niezmienionymi źródłami HEAD potwierdza te same 14 niepowodzeń. Nie dotyczą nowego zejścia Wenus ani resize; część nadal sprawdza dawne interakcje pod E. Wynik tego porównania jest zapisany w `dist/qa-venus-baseline.log`.
