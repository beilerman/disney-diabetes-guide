document.addEventListener('alpine:init', () => {
    Alpine.data('menuApp', () => ({
        // --- State Properties ---
        allData: { parks: [] }, // Holds all data from data.json
        selectedParkId: null,    // The ID of the currently selected park, e.g., "hollywood-studios"
        loading: true,
        
        // Filter and Sort states
        searchTerm: '',
        maxCarbs: null,
        sortBy: 'name',
        land: 'All',
        showGLP1Only: false,
        showVegetarianOnly: false,
        hideDrinks: false,

        // Nutrition Tracker states
        trackerItems: [],
        trackerExpanded: false,

        // --- Initialization ---
        async init() {
            // Fetch the external data file
            try {
                const response = await fetch('data.json');
                if (!response.ok) throw new Error('Network response was not ok.');
                this.allData = await response.json();
                
                // Set the first park as the default selection
                if (this.allData.parks && this.allData.parks.length > 0) {
                    this.selectedParkId = this.allData.parks[0].id;
                }
            } catch (error) {
                console.error("Failed to load park data:", error);
                // Handle error state in UI if necessary
            } finally {
                this.loading = false;
            }

            // Watch for changes to the selected park and reset filters
            this.$watch('selectedParkId', () => {
                this.land = 'All';
                this.searchTerm = '';
            });
        },

        // --- Computed Properties (Getters) ---
        get selectedPark() {
            if (!this.selectedParkId || this.allData.parks.length === 0) {
                return { name: 'Select a Park', subtitle: '', lands: [], menuItems: [] };
            }
            return this.allData.parks.find(p => p.id === this.selectedParkId);
        },

        get currentMenu() {
            // Add the glp1Friendly property to each item on the fly
            return this.selectedPark.menuItems.map(item => ({
                ...item,
                glp1Friendly: item.calories < 400 && item.fat < 20 && !item.isFried && item.type === 'food'
            }));
        },

        get filteredMenu() {
            let filtered = [...this.currentMenu];

            if (this.searchTerm) {
                const q = this.searchTerm.toLowerCase();
                filtered = filtered.filter(item => 
                    item.name.toLowerCase().includes(q) ||
                    item.description.toLowerCase().includes(q) ||
                    item.restaurant.toLowerCase().includes(q)
                );
            }

            if (this.maxCarbs && this.maxCarbs > 0) {
                filtered = filtered.filter(item => item.carbs <= this.maxCarbs);
            }
            
            if (this.land !== 'All') {
                filtered = filtered.filter(item => item.land === this.land);
            }
            
            if (this.showGLP1Only) {
                filtered = filtered.filter(item => item.glp1Friendly);
            }
            
            if (this.showVegetarianOnly) {
                filtered = filtered.filter(item => item.vegetarian);
            }

            if (this.hideDrinks) {
                filtered = filtered.filter(item => item.type !== 'drink');
            }

            // Sorting logic
            if (this.sortBy === 'name') {
                filtered.sort((a, b) => a.name.localeCompare(b.name));
            } else if (this.sortBy === 'carbs_asc') {
                filtered.sort((a, b) => a.carbs - b.carbs);
            } else if (this.sortBy === 'carbs_desc') {
                filtered.sort((a, b) => b.carbs - a.carbs);
            }

            return filtered;
        },

        // Tracker totals
        get totalCarbs() {
            return this.trackerItems.reduce((total, item) => total + item.carbs, 0);
        },
        get totalFat() {
            return this.trackerItems.reduce((total, item) => total + item.fat, 0);
        },
        get totalCalories() {
            return this.trackerItems.reduce((total, item) => total + item.calories, 0);
        },

        // --- Methods ---
        addToTracker(item) {
            this.trackerItems.push({ name: item.name, carbs: item.carbs, fat: item.fat, calories: item.calories });
            this.trackerExpanded = true;
        },

        scrollTo(id) {
            document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
        },
    }));
});