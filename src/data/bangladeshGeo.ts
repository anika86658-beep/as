export interface UpazilaItem {
  name: string;
  bnName: string;
}

export interface DistrictItem {
  id: string;
  name: string;
  bnName: string;
  division: string;
  isDhakaCity?: boolean;
  upazilas: UpazilaItem[];
}

export const BANGLADESH_DISTRICTS: DistrictItem[] = [
  // Dhaka Division
  {
    id: 'dhaka',
    name: 'Dhaka',
    bnName: 'ঢাকা',
    division: 'Dhaka',
    isDhakaCity: true,
    upazilas: [
      { name: 'Dhanmondi', bnName: 'ধানমন্ডি' },
      { name: 'Gulshan', bnName: 'গুলশান' },
      { name: 'Banani', bnName: 'বনানী' },
      { name: 'Uttara', bnName: 'উত্তরা' },
      { name: 'Mirpur', bnName: 'মিরপুর' },
      { name: 'Mohammadpur', bnName: 'মোহাম্মদপুর' },
      { name: 'Badda', bnName: 'বাড্ডা' },
      { name: 'Motijheel', bnName: 'মতিঝিল' },
      { name: 'Paltan', bnName: 'পল্টন' },
      { name: 'Tejgaon', bnName: 'তেজগাঁও' },
      { name: 'Rampura', bnName: 'রামপুরা' },
      { name: 'Khilgaon', bnName: 'খিলগাঁও' },
      { name: 'Jatrabari', bnName: 'যাত্রাবাড়ী' },
      { name: 'Old Dhaka (Kotwali/Lalbagh)', bnName: 'পুরান ঢাকা (কোতোয়ালি/লালবাগ)' },
      { name: 'Shahbagh', bnName: 'শাহবাগ' },
      { name: 'Bashundhara R/A', bnName: 'বসুন্ধরা আ/এ' },
      { name: 'Savar', bnName: 'সাভার' },
      { name: 'Keraniganj', bnName: 'কেরানীগঞ্জ' },
      { name: 'Dhamrai', bnName: 'ধামরাই' },
      { name: 'Dohar', bnName: 'দোহার' },
      { name: 'Nawabganj', bnName: 'নবাবগঞ্জ' },
      { name: 'Ashulia', bnName: 'আশুলিয়া' }
    ]
  },
  {
    id: 'gazipur',
    name: 'Gazipur',
    bnName: 'গাজীপুর',
    division: 'Dhaka',
    upazilas: [
      { name: 'Gazipur Sadar', bnName: 'গাজীপুর সদর' },
      { name: 'Kaliakair', bnName: 'কালিয়াকৈর' },
      { name: 'Kaliganj', bnName: 'কালীগঞ্জ' },
      { name: 'Kapasia', bnName: 'কাপাসিয়া' },
      { name: 'Sreepur', bnName: 'শ্রীপুর' },
      { name: 'Tongi', bnName: 'টঙ্গী' }
    ]
  },
  {
    id: 'narayanganj',
    name: 'Narayanganj',
    bnName: 'নারায়ণগঞ্জ',
    division: 'Dhaka',
    upazilas: [
      { name: 'Narayanganj Sadar', bnName: 'নারায়ণগঞ্জ সদর' },
      { name: 'Araihazar', bnName: 'আড়াইহাজার' },
      { name: 'Bandar', bnName: 'বন্দর' },
      { name: 'Rupganj', bnName: 'রূপগঞ্জ' },
      { name: 'Sonargaon', bnName: 'সোনারগাঁও' },
      { name: 'Siddhirganj', bnName: 'সিদ্ধিরগঞ্জ' },
      { name: 'Fatullah', bnName: 'ফতুল্লা' }
    ]
  },
  {
    id: 'narsingdi',
    name: 'Narsingdi',
    bnName: 'নরসিংদী',
    division: 'Dhaka',
    upazilas: [
      { name: 'Narsingdi Sadar', bnName: 'নরসিংদী সদর' },
      { name: 'Belabo', bnName: 'বেলাবো' },
      { name: 'Monohardi', bnName: 'মনোহরদী' },
      { name: 'Palash', bnName: 'পলাশ' },
      { name: 'Raipura', bnName: 'রায়পুরা' },
      { name: 'Shibpur', bnName: 'শিবপুর' }
    ]
  },
  {
    id: 'tangail',
    name: 'Tangail',
    bnName: 'টাঙ্গাইল',
    division: 'Dhaka',
    upazilas: [
      { name: 'Tangail Sadar', bnName: 'টাঙ্গাইল সদর' },
      { name: 'Basail', bnName: 'বাসাইল' },
      { name: 'Bhuapur', bnName: 'ভুয়াপুর' },
      { name: 'Delduar', bnName: 'দেলদুয়ার' },
      { name: 'Ghatail', bnName: 'ঘাটাইল' },
      { name: 'Gopalpur', bnName: 'গোপালপুর' },
      { name: 'Kalihati', bnName: 'কালিহাতী' },
      { name: 'Madhupur', bnName: 'মধুপুর' },
      { name: 'Mirzapur', bnName: 'মির্জাপুর' },
      { name: 'Nagarpur', bnName: 'নাগরপুর' },
      { name: 'Sakhipur', bnName: 'সখিপুর' },
      { name: 'Dhanbari', bnName: 'ধনবাড়ী' }
    ]
  },
  {
    id: 'manikganj',
    name: 'Manikganj',
    bnName: 'মানিকগঞ্জ',
    division: 'Dhaka',
    upazilas: [
      { name: 'Manikganj Sadar', bnName: 'মানিকগঞ্জ সদর' },
      { name: 'Daulatpur', bnName: 'দৌলতপুর' },
      { name: 'Ghiror', bnName: 'ঘিওর' },
      { name: 'Harirampur', bnName: 'হরিরামপুর' },
      { name: 'Saturia', bnName: 'সাটুরিয়া' },
      { name: 'Shivalaya', bnName: 'শিবালয়' },
      { name: 'Singair', bnName: 'সিংগাইর' }
    ]
  },
  {
    id: 'munshiganj',
    name: 'Munshiganj',
    bnName: 'মুন্সীগঞ্জ',
    division: 'Dhaka',
    upazilas: [
      { name: 'Munshiganj Sadar', bnName: 'মুন্সীগঞ্জ সদর' },
      { name: 'Gazaria', bnName: 'গজারিয়া' },
      { name: 'Lohajang', bnName: 'লৌহজং' },
      { name: 'Sirajdikhan', bnName: 'সিরাজদিখান' },
      { name: 'Sreenagar', bnName: 'শ্রীনগর' },
      { name: 'Tongibari', bnName: 'টঙ্গীবাড়ী' }
    ]
  },
  {
    id: 'faridpur',
    name: 'Faridpur',
    bnName: 'ফরিদপুর',
    division: 'Dhaka',
    upazilas: [
      { name: 'Faridpur Sadar', bnName: 'ফরিদপুর সদর' },
      { name: 'Alfadanga', bnName: 'আলফাডাঙ্গা' },
      { name: 'Bhanga', bnName: 'ভাঙ্গা' },
      { name: 'Boalmari', bnName: 'বোয়ালমারী' },
      { name: 'Charbhadrasan', bnName: 'চরভদ্রাসন' },
      { name: 'Madhukhali', bnName: 'মধুখালী' },
      { name: 'Nagarkanda', bnName: 'নগরকান্দা' },
      { name: 'Sadarpur', bnName: 'সদরপুর' },
      { name: 'Saltha', bnName: 'সালথা' }
    ]
  },
  {
    id: 'gopalganj',
    name: 'Gopalganj',
    bnName: 'গোপালগঞ্জ',
    division: 'Dhaka',
    upazilas: [
      { name: 'Gopalganj Sadar', bnName: 'গোপালগঞ্জ সদর' },
      { name: 'Kashiani', bnName: 'কাশিয়ানী' },
      { name: 'Kotalipara', bnName: 'কোটালীপাড়া' },
      { name: 'Muksudpur', bnName: 'মুকসুদপুর' },
      { name: 'Tungipara', bnName: 'টুঙ্গিপাড়া' }
    ]
  },
  {
    id: 'madaripur',
    name: 'Madaripur',
    bnName: 'মাদারীপুর',
    division: 'Dhaka',
    upazilas: [
      { name: 'Madaripur Sadar', bnName: 'মাদারীপুর সদর' },
      { name: 'Kalkini', bnName: 'কালকিনি' },
      { name: 'Rajoir', bnName: 'রাজৈর' },
      { name: 'Shibchar', bnName: 'শিবচর' },
      { name: 'Dasar', bnName: 'ডাসার' }
    ]
  },
  {
    id: 'rajbari',
    name: 'Rajbari',
    bnName: 'রাজবাড়ী',
    division: 'Dhaka',
    upazilas: [
      { name: 'Rajbari Sadar', bnName: 'রাজবাড়ী সদর' },
      { name: 'Baliakandi', bnName: 'বালিয়াকান্দি' },
      { name: 'Goalandaghat', bnName: 'গোয়ালন্দঘাট' },
      { name: 'Pangsha', bnName: 'পাংশা' },
      { name: 'Kalukhali', bnName: 'কালুখালী' }
    ]
  },
  {
    id: 'shariatpur',
    name: 'Shariatpur',
    bnName: 'শরীয়তপুর',
    division: 'Dhaka',
    upazilas: [
      { name: 'Shariatpur Sadar', bnName: 'শরীয়তপুর সদর' },
      { name: 'Bhedarganj', bnName: 'ভেদরগঞ্জ' },
      { name: 'Damudya', bnName: 'ডামুড্যা' },
      { name: 'Gosairhat', bnName: 'গোসাইরহাট' },
      { name: 'Naria', bnName: 'নড়িয়া' },
      { name: 'Zajira', bnName: 'জাজিরা' }
    ]
  },
  {
    id: 'kishoreganj',
    name: 'Kishoreganj',
    bnName: 'কিশোরগঞ্জ',
    division: 'Dhaka',
    upazilas: [
      { name: 'Kishoreganj Sadar', bnName: 'কিশোরগঞ্জ সদর' },
      { name: 'Austagram', bnName: 'অষ্টগ্রাম' },
      { name: 'Bajitpur', bnName: 'বাজিতপুর' },
      { name: 'Bhairab', bnName: 'ভৈরব' },
      { name: 'Hossainpur', bnName: 'হোসেনপুর' },
      { name: 'Itna', bnName: 'ইটনা' },
      { name: 'Karimganj', bnName: 'করিমগঞ্জ' },
      { name: 'Katiadi', bnName: 'কটিয়াদী' },
      { name: 'Kuliarchar', bnName: 'কুলিয়ারচর' },
      { name: 'Mithamain', bnName: 'মিঠামইন' },
      { name: 'Nikli', bnName: 'নিকলী' },
      { name: 'Pakundia', bnName: 'পাকুন্দিয়া' },
      { name: 'Tarail', bnName: 'তাড়াইল' }
    ]
  },

  // Chattogram Division
  {
    id: 'chattogram',
    name: 'Chattogram',
    bnName: 'চট্টগ্রাম',
    division: 'Chattogram',
    upazilas: [
      { name: 'Kotwali', bnName: 'কোতোয়ালি' },
      { name: 'Panchlaish', bnName: 'পাঁচলাইশ' },
      { name: 'Halishahar', bnName: 'হালিশহর' },
      { name: 'Pahartali', bnName: 'পাহাড়তলী' },
      { name: 'Agrabad', bnName: 'আগ্রাবাদ' },
      { name: 'Khulshi', bnName: 'খুলশী' },
      { name: 'Patenga', bnName: 'পতেঙ্গা' },
      { name: 'Anwara', bnName: 'আনোয়ারা' },
      { name: 'Banshkhali', bnName: 'বাঁশখালী' },
      { name: 'Boalkhali', bnName: 'বোয়ালখালী' },
      { name: 'Chandanaish', bnName: 'চন্দনাইশ' },
      { name: 'Fatikchhari', bnName: 'ফটিকছড়ি' },
      { name: 'Hathazari', bnName: 'হাটহাজারী' },
      { name: 'Lohagara', bnName: 'লোহাগাড়া' },
      { name: 'Mirsharai', bnName: 'মীরসরাই' },
      { name: 'Patiya', bnName: 'পটিয়া' },
      { name: 'Rangunia', bnName: 'রাঙ্গুনিয়া' },
      { name: 'Raozan', bnName: 'রাউজান' },
      { name: 'Sandwip', bnName: 'সন্দ্বীপ' },
      { name: 'Satkania', bnName: 'সাতকানিয়া' },
      { name: 'Sitakunda', bnName: 'সীতাকুণ্ড' },
      { name: 'Karnafuli', bnName: 'কর্ণফুলী' }
    ]
  },
  {
    id: 'cumilla',
    name: 'Cumilla',
    bnName: 'কুমিল্লা',
    division: 'Chattogram',
    upazilas: [
      { name: 'Cumilla Sadar', bnName: 'কুমিল্লা সদর' },
      { name: 'Barura', bnName: 'বরুড়া' },
      { name: 'Brahmanpara', bnName: 'ব্রাহ্মণপাড়া' },
      { name: 'Burichang', bnName: 'বুড়িচং' },
      { name: 'Chandina', bnName: 'চান্দিনা' },
      { name: 'Chouddagram', bnName: 'চৌদ্দগ্রাম' },
      { name: 'Daudkandi', bnName: 'দাউদকান্দি' },
      { name: 'Debidwar', bnName: 'দেবিদ্বার' },
      { name: 'Homna', bnName: 'হোমনা' },
      { name: 'Laksam', bnName: 'লাকসাম' },
      { name: 'Monohargonj', bnName: 'মনোহরগঞ্জ' },
      { name: 'Meghna', bnName: 'মেঘনা' },
      { name: 'Muradnagar', bnName: 'মুরাদনগর' },
      { name: 'Nangalkot', bnName: 'নাঙ্গলকোট' },
      { name: 'Titas', bnName: 'তিতাস' },
      { name: 'Lalmai', bnName: 'লালমাই' }
    ]
  },
  {
    id: 'coxs_bazar',
    name: "Cox's Bazar",
    bnName: 'কক্সবাজার',
    division: 'Chattogram',
    upazilas: [
      { name: "Cox's Bazar Sadar", bnName: 'কক্সবাজার সদর' },
      { name: 'Chakaria', bnName: 'চকোরিয়া' },
      { name: 'Kutubdia', bnName: 'কুতুবদিয়া' },
      { name: 'Maheshkhali', bnName: 'মহেশখালী' },
      { name: 'Ramu', bnName: 'রামু' },
      { name: 'Teknaf', bnName: 'টেকনাফ' },
      { name: 'Ukhia', bnName: 'উখিয়া' },
      { name: 'Pekua', bnName: 'পেকুয়া' },
      { name: 'Eidgaon', bnName: 'ঈদগাঁও' }
    ]
  },
  {
    id: 'brahmanbaria',
    name: 'Brahmanbaria',
    bnName: 'ব্রাহ্মণবাড়িয়া',
    division: 'Chattogram',
    upazilas: [
      { name: 'Brahmanbaria Sadar', bnName: 'ব্রাহ্মণবাড়িয়া সদর' },
      { name: 'Ashuganj', bnName: 'আশুগঞ্জ' },
      { name: 'Bancharampur', bnName: 'বাঞ্ছারামপুর' },
      { name: 'Kasba', bnName: 'কসবা' },
      { name: 'Nabinagar', bnName: 'নবীনগর' },
      { name: 'Nasirnagar', bnName: 'নাসিরনগর' },
      { name: 'Sarail', bnName: 'সরাইল' },
      { name: 'Akhaura', bnName: 'আখাউড়া' },
      { name: 'Bijoynagar', bnName: 'বিজয়নগর' }
    ]
  },
  {
    id: 'chandpur',
    name: 'Chandpur',
    bnName: 'চাঁদপুর',
    division: 'Chattogram',
    upazilas: [
      { name: 'Chandpur Sadar', bnName: 'চাঁদপুর সদর' },
      { name: 'Faridganj', bnName: 'ফরিদগঞ্জ' },
      { name: 'Haimchar', bnName: 'হাইমচর' },
      { name: 'Haziganj', bnName: 'হাজীগঞ্জ' },
      { name: 'Kachua', bnName: 'কচুয়া' },
      { name: 'Matlab North', bnName: 'মতলব উত্তর' },
      { name: 'Matlab South', bnName: 'মতলব দক্ষিণ' },
      { name: 'Shahrasti', bnName: 'শাহরাস্তি' }
    ]
  },
  {
    id: 'feni',
    name: 'Feni',
    bnName: 'ফেনী',
    division: 'Chattogram',
    upazilas: [
      { name: 'Feni Sadar', bnName: 'ফেনী সদর' },
      { name: 'Chhagalnaiya', bnName: 'ছাগলনাইয়া' },
      { name: 'Daganbhuiyan', bnName: 'দাগনভূঞা' },
      { name: 'Parshuram', bnName: 'পরশুরাম' },
      { name: 'Fulgazi', bnName: 'ফুলগাজী' },
      { name: 'Sonagazi', bnName: 'সোনাগাজী' }
    ]
  },
  {
    id: 'noakhali',
    name: 'Noakhali',
    bnName: 'নোয়াখালী',
    division: 'Chattogram',
    upazilas: [
      { name: 'Noakhali Sadar', bnName: 'নোয়াখালী সদর' },
      { name: 'Begumganj', bnName: 'বেগমগঞ্জ' },
      { name: 'Chatkhil', bnName: 'চাটখিল' },
      { name: 'Companiganj', bnName: 'কোম্পানীগঞ্জ' },
      { name: 'Hatiya', bnName: 'হাতিয়া' },
      { name: 'Senbagh', bnName: 'সেনবাগ' },
      { name: 'Sonaimuri', bnName: 'সোনাইমুড়ী' },
      { name: 'Subarnachar', bnName: 'সুবর্ণচর' },
      { name: 'Kabirhat', bnName: 'কবিরহাট' }
    ]
  },
  {
    id: 'lakshmipur',
    name: 'Lakshmipur',
    bnName: 'লক্ষ্মীপুর',
    division: 'Chattogram',
    upazilas: [
      { name: 'Lakshmipur Sadar', bnName: 'লক্ষ্মীপুর সদর' },
      { name: 'Raipur', bnName: 'রায়পুর' },
      { name: 'Ramganj', bnName: 'রামগঞ্জ' },
      { name: 'Ramgati', bnName: 'রামগতি' },
      { name: 'Kamalnagar', bnName: 'কমলনগর' }
    ]
  },
  {
    id: 'rangamati',
    name: 'Rangamati',
    bnName: 'রাঙ্গামাটি',
    division: 'Chattogram',
    upazilas: [
      { name: 'Rangamati Sadar', bnName: 'রাঙ্গামাটি সদর' },
      { name: 'Bagaichhari', bnName: 'বাঘাইছড়ি' },
      { name: 'Barkal', bnName: 'বরকল' },
      { name: 'Belaichhari', bnName: 'বিলাইছড়ি' },
      { name: 'Juraichhari', bnName: 'জুরাইছড়ি' },
      { name: 'Kaptai', bnName: 'কাপ্তাই' },
      { name: 'Kawkhali', bnName: 'কাউখালী' },
      { name: 'Langadu', bnName: 'লংগদু' },
      { name: 'Naniarchar', bnName: 'নানিয়ারচর' },
      { name: 'Rajasthali', bnName: 'রাজস্থলী' }
    ]
  },
  {
    id: 'bandarban',
    name: 'Bandarban',
    bnName: 'বান্দরবান',
    division: 'Chattogram',
    upazilas: [
      { name: 'Bandarban Sadar', bnName: 'বান্দরবান সদর' },
      { name: 'Alikadam', bnName: 'আলীকদম' },
      { name: 'Lama', bnName: 'লামা' },
      { name: 'Naikhongchhari', bnName: 'নাইক্ষ্যংছড়ি' },
      { name: 'Rowangchhari', bnName: 'রোয়াংছড়ি' },
      { name: 'Ruma', bnName: 'রুমা' },
      { name: 'Thanchi', bnName: 'থানচি' }
    ]
  },
  {
    id: 'khagrachhari',
    name: 'Khagrachhari',
    bnName: 'খাগড়াছড়ি',
    division: 'Chattogram',
    upazilas: [
      { name: 'Khagrachhari Sadar', bnName: 'খাগড়াছড়ি সদর' },
      { name: 'Dighinala', bnName: 'দিঘীনালা' },
      { name: 'Lakshmichhari', bnName: 'লক্ষ্মীছড়ি' },
      { name: 'Mahalchhari', bnName: 'মহালছড়ি' },
      { name: 'Manikchhari', bnName: 'মানিকছড়ি' },
      { name: 'Matiranga', bnName: 'মাটিরাঙ্গা' },
      { name: 'Panchhari', bnName: 'পানছড়ি' },
      { name: 'Ramgarh', bnName: 'রামগড়' },
      { name: 'Guimara', bnName: 'গুইমারা' }
    ]
  },

  // Sylhet Division
  {
    id: 'sylhet',
    name: 'Sylhet',
    bnName: 'সিলেট',
    division: 'Sylhet',
    upazilas: [
      { name: 'Sylhet Sadar', bnName: 'সিলেট সদর' },
      { name: 'Balaganj', bnName: 'বালাগঞ্জ' },
      { name: 'Beanibazar', bnName: 'বিয়ানীবাজার' },
      { name: 'Bishwanath', bnName: 'বিশ্বনাথ' },
      { name: 'Companiganj', bnName: 'কোম্পানীগঞ্জ' },
      { name: 'Fenchuganj', bnName: 'ফেঞ্চুগঞ্জ' },
      { name: 'Golapganj', bnName: 'গোলাপগঞ্জ' },
      { name: 'Gowainghat', bnName: 'গোয়াইনঘাট' },
      { name: 'Jaintiapur', bnName: 'জৈন্তাপুর' },
      { name: 'Kanaighat', bnName: 'কানাইঘাট' },
      { name: 'Zakiganj', bnName: 'জকিগঞ্জ' },
      { name: 'Dakshin Surma', bnName: 'দক্ষিণ সুরমা' },
      { name: 'Osmani Nagar', bnName: 'ওসমানী নগর' }
    ]
  },
  {
    id: 'moulvibazar',
    name: 'Moulvibazar',
    bnName: 'মৌলভীবাজার',
    division: 'Sylhet',
    upazilas: [
      { name: 'Moulvibazar Sadar', bnName: 'মৌলভীবাজার সদর' },
      { name: 'Barlekha', bnName: 'বড়লেখা' },
      { name: 'Kamalganj', bnName: 'কমলগঞ্জ' },
      { name: 'Kulaura', bnName: 'কুলাউড়া' },
      { name: 'Rajnagar', bnName: 'রাজনগর' },
      { name: 'Sreemangal', bnName: 'শ্রীমঙ্গল' },
      { name: 'Juri', bnName: 'জুড়ী' }
    ]
  },
  {
    id: 'habiganj',
    name: 'Habiganj',
    bnName: 'হবিগঞ্জ',
    division: 'Sylhet',
    upazilas: [
      { name: 'Habiganj Sadar', bnName: 'হবিগঞ্জ সদর' },
      { name: 'Ajmiriganj', bnName: 'আজমিরীগঞ্জ' },
      { name: 'Bahubal', bnName: 'বাহুবল' },
      { name: 'Baniyachong', bnName: 'বানিয়াচং' },
      { name: 'Chunarughat', bnName: 'চুনারুঘাট' },
      { name: 'Lakhai', bnName: 'লাখাই' },
      { name: 'Madhabpur', bnName: 'মাধবপুর' },
      { name: 'Nabiganj', bnName: 'নবীগঞ্জ' },
      { name: 'Sayestaganj', bnName: 'শায়েস্তাগঞ্জ' }
    ]
  },
  {
    id: 'sunamganj',
    name: 'Sunamganj',
    bnName: 'সুনামগঞ্জ',
    division: 'Sylhet',
    upazilas: [
      { name: 'Sunamganj Sadar', bnName: 'সুনামগঞ্জ সদর' },
      { name: 'Bishwamvarpur', bnName: 'বিশ্বম্ভরপুর' },
      { name: 'Chhatak', bnName: 'ছাতক' },
      { name: 'Derai', bnName: 'দিরাই' },
      { name: 'Dharampasha', bnName: 'ধর্মপাশা' },
      { name: 'Dowarabazar', bnName: 'দোয়ারাবাজার' },
      { name: 'Jagannathpur', bnName: 'জগন্নাথপুর' },
      { name: 'Jamalganj', bnName: 'জামালগঞ্জ' },
      { name: 'Sullah', bnName: 'শাল্লা' },
      { name: 'Tahirpur', bnName: 'তাহিরপুর' },
      { name: 'South Sunamganj (Shantiganj)', bnName: 'শান্তিগঞ্জ' },
      { name: 'Madhyanagar', bnName: 'মধ্যনগর' }
    ]
  },

  // Rajshahi Division
  {
    id: 'rajshahi',
    name: 'Rajshahi',
    bnName: 'রাজশাহী',
    division: 'Rajshahi',
    upazilas: [
      { name: 'Boalia (Rajshahi City)', bnName: 'বোয়ালিয়া (রাজশাহী সিটি)' },
      { name: 'Motihar', bnName: 'মতিহার' },
      { name: 'Rajpara', bnName: 'রাজপাড়া' },
      { name: 'Shah Makhdum', bnName: 'শাহ মখদুম' },
      { name: 'Bagha', bnName: 'বাঘা' },
      { name: 'Bagmara', bnName: 'বাগমারা' },
      { name: 'Charghat', bnName: 'চারঘাট' },
      { name: 'Durgapur', bnName: 'দুর্গাপুর' },
      { name: 'Godagari', bnName: 'গোদাগাড়ী' },
      { name: 'Mohanpur', bnName: 'মোহনপুর' },
      { name: 'Paba', bnName: 'পবা' },
      { name: 'Puthia', bnName: 'পুঠিয়া' },
      { name: 'Tanore', bnName: 'তানোর' }
    ]
  },
  {
    id: 'bogura',
    name: 'Bogura',
    bnName: 'বগুড়া',
    division: 'Rajshahi',
    upazilas: [
      { name: 'Bogura Sadar', bnName: 'বগুড়া সদর' },
      { name: 'Adamdighi', bnName: 'আদমদিঘী' },
      { name: 'Dhunat', bnName: 'ধুনট' },
      { name: 'Dhupchanchia', bnName: 'দুপচাঁচিয়া' },
      { name: 'Gabtali', bnName: 'গাবতলী' },
      { name: 'Kahaloo', bnName: 'কাহালু' },
      { name: 'Nandigram', bnName: 'নন্দীগ্রাম' },
      { name: 'Sariakandi', bnName: 'সারিয়াকান্দি' },
      { name: 'Sahajanpur', bnName: 'শাজাহানপুর' },
      { name: 'Sherpur', bnName: 'শেরপুর' },
      { name: 'Shibganj', bnName: 'শিবগঞ্জ' },
      { name: 'Sonatala', bnName: 'সোনাতলা' }
    ]
  },
  {
    id: 'pabna',
    name: 'Pabna',
    bnName: 'পাবনা',
    division: 'Rajshahi',
    upazilas: [
      { name: 'Pabna Sadar', bnName: 'পাবনা সদর' },
      { name: 'Atgharia', bnName: 'আটঘরিয়া' },
      { name: 'Bera', bnName: 'বেড়া' },
      { name: 'Bhangura', bnName: 'ভাঙ্গুড়া' },
      { name: 'Chatmohar', bnName: 'চাটমোহর' },
      { name: 'Faridpur', bnName: 'ফরিদপুর' },
      { name: 'Ishwardi', bnName: 'ঈশ্বরদী' },
      { name: 'Santhia', bnName: 'সাঁথিয়া' },
      { name: 'Sujanagar', bnName: 'সুজানগর' }
    ]
  },
  {
    id: 'sirajganj',
    name: 'Sirajganj',
    bnName: 'সিরাজগঞ্জ',
    division: 'Rajshahi',
    upazilas: [
      { name: 'Sirajganj Sadar', bnName: 'সিরাজগঞ্জ সদর' },
      { name: 'Belkuchi', bnName: 'বেলকুচি' },
      { name: 'Chauhali', bnName: 'চৌহালী' },
      { name: 'Kamarkhanda', bnName: 'কামারখন্দ' },
      { name: 'Kazipur', bnName: 'কাজীপুর' },
      { name: 'Raiganj', bnName: 'রায়গঞ্জ' },
      { name: 'Shahjadpur', bnName: 'শাহজাদপুর' },
      { name: 'Tarash', bnName: 'তাড়াশ' },
      { name: 'Ullahpara', bnName: 'উল্লাপাড়া' }
    ]
  },
  {
    id: 'naogaon',
    name: 'Naogaon',
    bnName: 'নওগাঁ',
    division: 'Rajshahi',
    upazilas: [
      { name: 'Naogaon Sadar', bnName: 'নওগাঁ সদর' },
      { name: 'Atrai', bnName: 'আত্রাই' },
      { name: 'Badalgachhi', bnName: 'বদলগাছী' },
      { name: 'Dhamoirhat', bnName: 'ধামইরহাট' },
      { name: 'Manda', bnName: 'মান্দা' },
      { name: 'Mohadevpur', bnName: 'মহাদেবপুর' },
      { name: 'Niamatpur', bnName: 'নিয়ামতপুর' },
      { name: 'Patnitala', bnName: 'পত্নীতলা' },
      { name: 'Porsha', bnName: 'পোরশা' },
      { name: 'Raninagar', bnName: 'রাণীনগর' },
      { name: 'Sapahar', bnName: 'সাপাহার' }
    ]
  },
  {
    id: 'natore',
    name: 'Natore',
    bnName: 'নাটোর',
    division: 'Rajshahi',
    upazilas: [
      { name: 'Natore Sadar', bnName: 'নাটোর সদর' },
      { name: 'Bagatipara', bnName: 'বাগাতিপাড়া' },
      { name: 'Baraigram', bnName: 'বড়াইগ্রাম' },
      { name: 'Gurudaspur', bnName: 'গুরুদাসপুর' },
      { name: 'Lalpur', bnName: 'লালপুর' },
      { name: 'Singra', bnName: 'সিংড়া' },
      { name: 'Naldanga', bnName: 'নলডাঙ্গা' }
    ]
  },
  {
    id: 'chapai_nawabganj',
    name: 'Chapai Nawabganj',
    bnName: 'চাঁপাইনবাবগঞ্জ',
    division: 'Rajshahi',
    upazilas: [
      { name: 'Chapai Nawabganj Sadar', bnName: 'চাঁপাইনবাবগঞ্জ সদর' },
      { name: 'Bholahat', bnName: 'ভোলাহাট' },
      { name: 'Gomastapur', bnName: 'গোমস্তাপুর' },
      { name: 'Nachole', bnName: 'নাচোল' },
      { name: 'Shibganj', bnName: 'শিবগঞ্জ' }
    ]
  },
  {
    id: 'joypurhat',
    name: 'Joypurhat',
    bnName: 'জয়পুরহাট',
    division: 'Rajshahi',
    upazilas: [
      { name: 'Joypurhat Sadar', bnName: 'জয়পুরহাট সদর' },
      { name: 'Akkelpur', bnName: 'আক্কেলপুর' },
      { name: 'Kalai', bnName: 'কালাই' },
      { name: 'Khetlal', bnName: 'ক্ষেতলাল' },
      { name: 'Panchbibi', bnName: 'পাঁচবিবি' }
    ]
  },

  // Khulna Division
  {
    id: 'khulna',
    name: 'Khulna',
    bnName: 'খুলনা',
    division: 'Khulna',
    upazilas: [
      { name: 'Khulna Sadar / City', bnName: 'খুলনা সদর / সিটি' },
      { name: 'Sonadanga', bnName: 'সোনাডাঙ্গা' },
      { name: 'Khalishpur', bnName: 'খালিশপুর' },
      { name: 'Daulatpur', bnName: 'দৌলতপুর' },
      { name: 'Batiaghata', bnName: 'বটিয়াঘাটা' },
      { name: 'Dacope', bnName: 'দাকোপ' },
      { name: 'Dumuria', bnName: 'ডুমুরিয়া' },
      { name: 'Dighalia', bnName: 'দিঘলিয়া' },
      { name: 'Koyra', bnName: 'কয়রা' },
      { name: 'Paikgachha', bnName: 'পাইকগাছা' },
      { name: 'Phultala', bnName: 'ফুলতলা' },
      { name: 'Rupsha', bnName: 'রূপসা' },
      { name: 'Terokhada', bnName: 'তেরখাদা' }
    ]
  },
  {
    id: 'jashore',
    name: 'Jashore',
    bnName: 'যশোর',
    division: 'Khulna',
    upazilas: [
      { name: 'Jashore Sadar', bnName: 'যশোর সদর' },
      { name: 'Abhaynagar', bnName: 'অভয়নগর' },
      { name: 'Bagherpara', bnName: 'বাঘারপাড়া' },
      { name: 'Chaugachha', bnName: 'চৌগাছা' },
      { name: 'Jhikargachha', bnName: 'ঝিকরগাছা' },
      { name: 'Keshabpur', bnName: 'কেশবপুর' },
      { name: 'Manirampur', bnName: 'মণিরামপুর' },
      { name: 'Sharsha (Benapole)', bnName: 'শার্শা (বেনাপোল)' }
    ]
  },
  {
    id: 'kushtia',
    name: 'Kushtia',
    bnName: 'কুষ্টিয়া',
    division: 'Khulna',
    upazilas: [
      { name: 'Kushtia Sadar', bnName: 'কুষ্টিয়া সদর' },
      { name: 'Bheramara', bnName: 'ভেড়ামারা' },
      { name: 'Daulatpur', bnName: 'দৌলতপুর' },
      { name: 'Khoksa', bnName: 'খোকসা' },
      { name: 'Kumarkhali', bnName: 'কুমারখালী' },
      { name: 'Mirpur', bnName: 'মিরপুর' }
    ]
  },
  {
    id: 'satkhira',
    name: 'Satkhira',
    bnName: 'সাতক্ষীরা',
    division: 'Khulna',
    upazilas: [
      { name: 'Satkhira Sadar', bnName: 'সাতক্ষীরা সদর' },
      { name: 'Assasuni', bnName: 'আশাশুনি' },
      { name: 'Debhata', bnName: 'দেবহাটা' },
      { name: 'Kalaroa', bnName: 'কলারোয়া' },
      { name: 'Kaliganj', bnName: 'কালীগঞ্জ' },
      { name: 'Shyamnagar', bnName: 'শ্যামনগর' },
      { name: 'Tala', bnName: 'তালা' }
    ]
  },
  {
    id: 'bagerhat',
    name: 'Bagerhat',
    bnName: 'বাগেরহাট',
    division: 'Khulna',
    upazilas: [
      { name: 'Bagerhat Sadar', bnName: 'বাগেরহাট সদর' },
      { name: 'Chitalmari', bnName: 'চিতলমারী' },
      { name: 'Fakirhat', bnName: 'ফকিরহাট' },
      { name: 'Kachua', bnName: 'কচুয়া' },
      { name: 'Mollahat', bnName: 'মোল্লাহাট' },
      { name: 'Mongla', bnName: 'মোংলা' },
      { name: 'Morrelganj', bnName: 'মোরেলগঞ্জ' },
      { name: 'Rampal', bnName: 'রামপাল' },
      { name: 'Sarankhola', bnName: 'শরণখোলা' }
    ]
  },
  {
    id: 'jhenaidah',
    name: 'Jhenaidah',
    bnName: 'ঝিনাইদহ',
    division: 'Khulna',
    upazilas: [
      { name: 'Jhenaidah Sadar', bnName: 'ঝিনাইদহ সদর' },
      { name: 'Harinakunda', bnName: 'হরিণাকুণ্ডু' },
      { name: 'Kaliganj', bnName: 'কালীগঞ্জ' },
      { name: 'Kotchandpur', bnName: 'কোটচাঁদপুর' },
      { name: 'Maheshpur', bnName: 'মহেশপুর' },
      { name: 'Shailkupa', bnName: 'শৈলকুপা' }
    ]
  },
  {
    id: 'chuadanga',
    name: 'Chuadanga',
    bnName: 'চুয়াডাঙ্গা',
    division: 'Khulna',
    upazilas: [
      { name: 'Chuadanga Sadar', bnName: 'চুয়াডাঙ্গা সদর' },
      { name: 'Alamdanga', bnName: 'আলমডাঙ্গা' },
      { name: 'Damurhuda', bnName: 'দামুড়হুদা' },
      { name: 'Jibannagar', bnName: 'জীবননগর' }
    ]
  },
  {
    id: 'meherpur',
    name: 'Meherpur',
    bnName: 'মেহেরপুর',
    division: 'Khulna',
    upazilas: [
      { name: 'Meherpur Sadar', bnName: 'মেহেরপুর সদর' },
      { name: 'Gangni', bnName: 'গাংনী' },
      { name: 'Mujibnagar', bnName: 'মুজিবনগর' }
    ]
  },
  {
    id: 'magura',
    name: 'Magura',
    bnName: 'মাগুরা',
    division: 'Khulna',
    upazilas: [
      { name: 'Magura Sadar', bnName: 'মাগুরা সদর' },
      { name: 'Mohammadpur', bnName: 'মোহাম্মদপুর' },
      { name: 'Shalikha', bnName: 'শালিখা' },
      { name: 'Sreepur', bnName: 'শ্রীপুর' }
    ]
  },
  {
    id: 'narail',
    name: 'Narail',
    bnName: 'নড়াইল',
    division: 'Khulna',
    upazilas: [
      { name: 'Narail Sadar', bnName: 'নড়াইল সদর' },
      { name: 'Kalia', bnName: 'কালিয়া' },
      { name: 'Lohagara', bnName: 'লোহাগাড়া' }
    ]
  },

  // Barishal Division
  {
    id: 'barishal',
    name: 'Barishal',
    bnName: 'বরিশাল',
    division: 'Barishal',
    upazilas: [
      { name: 'Barishal Sadar', bnName: 'বরিশাল সদর' },
      { name: 'Agailjhara', bnName: 'আগৈলঝাড়া' },
      { name: 'Babuganj', bnName: 'বাবুগঞ্জ' },
      { name: 'Bakerganj', bnName: 'বাকেরগঞ্জ' },
      { name: 'Banaripara', bnName: 'বানারীপাড়া' },
      { name: 'Gaurnadi', bnName: 'গৌরনদী' },
      { name: 'Hizla', bnName: 'হিজলা' },
      { name: 'Mehendiganj', bnName: 'মেহেন্দিগঞ্জ' },
      { name: 'Muladi', bnName: 'মুলাদী' },
      { name: 'Wazirpur', bnName: 'উজিরপুর' }
    ]
  },
  {
    id: 'bhola',
    name: 'Bhola',
    bnName: 'ভোলা',
    division: 'Barishal',
    upazilas: [
      { name: 'Bhola Sadar', bnName: 'ভোলা সদর' },
      { name: 'Burhanuddin', bnName: 'বোরহানউদ্দিন' },
      { name: 'Char Fasson', bnName: 'চরফ্যাশন' },
      { name: 'Daulatkhan', bnName: 'দৌলতখান' },
      { name: 'Lalmohan', bnName: 'লালমোহন' },
      { name: 'Manpura', bnName: 'মনপুরা' },
      { name: 'Tazumuddin', bnName: 'তজুমদ্দিন' }
    ]
  },
  {
    id: 'patuakhali',
    name: 'Patuakhali',
    bnName: 'পটুয়াখালী',
    division: 'Barishal',
    upazilas: [
      { name: 'Patuakhali Sadar', bnName: 'পটুয়াখালী সদর' },
      { name: 'Bauphal', bnName: 'বাউফল' },
      { name: 'Dashmina', bnName: 'দশমিনা' },
      { name: 'Galachipa', bnName: 'গলাচিপা' },
      { name: 'Kalapara (Kuakata)', bnName: 'কলাপাড়া (কুয়াকাটা)' },
      { name: 'Mirzaganj', bnName: 'মির্জাগঞ্জ' },
      { name: 'Dumki', bnName: 'দুমকি' },
      { name: 'Rangabali', bnName: 'রাঙ্গাবালী' }
    ]
  },
  {
    id: 'pirojpur',
    name: 'Pirojpur',
    bnName: 'পিরোজপুর',
    division: 'Barishal',
    upazilas: [
      { name: 'Pirojpur Sadar', bnName: 'পিরোজপুর সদর' },
      { name: 'Bhandaria', bnName: 'ভাণ্ডারিয়া' },
      { name: 'Kawkhali', bnName: 'কাউখালী' },
      { name: 'Mathbaria', bnName: 'মঠবাড়িয়া' },
      { name: 'Nazirpur', bnName: 'নাজিরপুর' },
      { name: 'Nesarabad (Swarupkati)', bnName: 'নেছারাবাদ (স্বরূপকাঠি)' },
      { name: 'Zianagar (Indurkani)', bnName: 'ইন্দুরকানী' }
    ]
  },
  {
    id: 'barguna',
    name: 'Barguna',
    bnName: 'বরগুনা',
    division: 'Barishal',
    upazilas: [
      { name: 'Barguna Sadar', bnName: 'বরগুনা সদর' },
      { name: 'Amtali', bnName: 'আমতলী' },
      { name: 'Bamna', bnName: 'বামনা' },
      { name: 'Betagi', bnName: 'বেতাগী' },
      { name: 'Patharghata', bnName: 'পাথরঘাটা' },
      { name: 'Taltali', bnName: 'তালতলী' }
    ]
  },
  {
    id: 'jhalokati',
    name: 'Jhalokati',
    bnName: 'ঝালকাঠি',
    division: 'Barishal',
    upazilas: [
      { name: 'Jhalokati Sadar', bnName: 'ঝালকাঠি সদর' },
      { name: 'Kathalia', bnName: 'কাঠালিয়া' },
      { name: 'Nalchity', bnName: 'নলছিটি' },
      { name: 'Rajapur', bnName: 'রাজাপুর' }
    ]
  },

  // Rangpur Division
  {
    id: 'rangpur',
    name: 'Rangpur',
    bnName: 'রংপুর',
    division: 'Rangpur',
    upazilas: [
      { name: 'Rangpur Sadar', bnName: 'রংপুর সদর' },
      { name: 'Badarganj', bnName: 'বদরগঞ্জ' },
      { name: 'Gangachhara', bnName: 'গঙ্গাচড়া' },
      { name: 'Kaunia', bnName: 'কাউনিয়া' },
      { name: 'Mithapukur', bnName: 'মিঠাপুকুর' },
      { name: 'Pirgachha', bnName: 'পীরগাছা' },
      { name: 'Pirganj', bnName: 'পীরগঞ্জ' },
      { name: 'Taraganj', bnName: 'তারাগঞ্জ' }
    ]
  },
  {
    id: 'dinajpur',
    name: 'Dinajpur',
    bnName: 'দিনাজপুর',
    division: 'Rangpur',
    upazilas: [
      { name: 'Dinajpur Sadar', bnName: 'দিনাজপুর সদর' },
      { name: 'Birampur', bnName: 'বিরামপুর' },
      { name: 'Birganj', bnName: 'বীরগঞ্জ' },
      { name: 'Biral', bnName: 'বিরল' },
      { name: 'Bochaganj', bnName: 'বোচাগঞ্জ' },
      { name: 'Chirirbandar', bnName: 'চিরিরবন্দর' },
      { name: 'Phulbari', bnName: 'ফুলবাড়ী' },
      { name: 'Ghoraghat', bnName: 'ঘোড়াঘাট' },
      { name: 'Hakimpur (Hili)', bnName: 'হাকিমপুর (হিলি)' },
      { name: 'Kaharole', bnName: 'কাহারোল' },
      { name: 'Khansama', bnName: 'খানসামা' },
      { name: 'Nawabganj', bnName: 'নবাবগঞ্জ' },
      { name: 'Parbatipur', bnName: 'পার্বতীপুর' }
    ]
  },
  {
    id: 'gaibandha',
    name: 'Gaibandha',
    bnName: 'গাইবান্ধা',
    division: 'Rangpur',
    upazilas: [
      { name: 'Gaibandha Sadar', bnName: 'গাইবান্ধা সদর' },
      { name: 'Fulchhari', bnName: 'ফুলছড়ি' },
      { name: 'Gobindaganj', bnName: 'গোবিন্দগঞ্জ' },
      { name: 'Palashbari', bnName: 'পলাশবাড়ী' },
      { name: 'Sadullapur', bnName: 'সাদুল্লাপুর' },
      { name: 'Saghata', bnName: 'সাঘাটা' },
      { name: 'Sundarganj', bnName: 'সুন্দরগঞ্জ' }
    ]
  },
  {
    id: 'kurigram',
    name: 'Kurigram',
    bnName: 'কুড়িগ্রাম',
    division: 'Rangpur',
    upazilas: [
      { name: 'Kurigram Sadar', bnName: 'কুড়িগ্রাম সদর' },
      { name: 'Bhurungamari', bnName: 'ভুরুঙ্গামারী' },
      { name: 'Char Rajibpur', bnName: 'চর রাজিবপুর' },
      { name: 'Chilmari', bnName: 'চিলমারী' },
      { name: 'Phulbari', bnName: 'ফুলবাড়ী' },
      { name: 'Nageshwari', bnName: 'নাগেশ্বরী' },
      { name: 'Rajarhat', bnName: 'রাজারহাট' },
      { name: 'Raomari', bnName: 'রৌমারী' },
      { name: 'Ulipur', bnName: 'উলিপুর' }
    ]
  },
  {
    id: 'lalmonirhat',
    name: 'Lalmonirhat',
    bnName: 'লালমনিরহাট',
    division: 'Rangpur',
    upazilas: [
      { name: 'Lalmonirhat Sadar', bnName: 'লালমনিরহাট সদর' },
      { name: 'Aditmari', bnName: 'আদিতমারী' },
      { name: 'Hatibandha', bnName: 'হাতীবান্ধা' },
      { name: 'Kaliganj', bnName: 'কালীগঞ্জ' },
      { name: 'Patgram (Burimari)', bnName: 'পাটগ্রাম (বুড়িমারী)' }
    ]
  },
  {
    id: 'nilphamari',
    name: 'Nilphamari',
    bnName: 'নীলফামারী',
    division: 'Rangpur',
    upazilas: [
      { name: 'Nilphamari Sadar', bnName: 'নীলফামারী সদর' },
      { name: 'Dimla', bnName: 'ডিমলা' },
      { name: 'Domar', bnName: 'ডোমার' },
      { name: 'Jaldhaka', bnName: 'জলঢাকা' },
      { name: 'Kishoreganj', bnName: 'কিশোরগঞ্জ' },
      { name: 'Saidpur', bnName: 'সৈয়দপুর' }
    ]
  },
  {
    id: 'panchagarh',
    name: 'Panchagarh',
    bnName: 'পঞ্চগড়',
    division: 'Rangpur',
    upazilas: [
      { name: 'Panchagarh Sadar', bnName: 'পঞ্চগড় সদর' },
      { name: 'Atwari', bnName: 'আটোয়ারী' },
      { name: 'Boda', bnName: 'বোদা' },
      { name: 'Debiganj', bnName: 'দেবীগঞ্জ' },
      { name: 'Tetulia', bnName: 'তেঁতুলিয়া' }
    ]
  },
  {
    id: 'thakurgaon',
    name: 'Thakurgaon',
    bnName: 'ঠাকুরগাঁও',
    division: 'Rangpur',
    upazilas: [
      { name: 'Thakurgaon Sadar', bnName: 'ঠাকুরগাঁও সদর' },
      { name: 'Baliadangi', bnName: 'বালিয়াডাঙ্গী' },
      { name: 'Haripur', bnName: 'হরিপুর' },
      { name: 'Pirganj', bnName: 'পীরগঞ্জ' },
      { name: 'Ranisankail', bnName: 'রাণীশংকৈল' }
    ]
  },

  // Mymensingh Division
  {
    id: 'mymensingh',
    name: 'Mymensingh',
    bnName: 'ময়মনসিংহ',
    division: 'Mymensingh',
    upazilas: [
      { name: 'Mymensingh Sadar', bnName: 'ময়মনসিংহ সদর' },
      { name: 'Bhaluka', bnName: 'ভালুকা' },
      { name: 'Dhobaura', bnName: 'ধোবাউড়া' },
      { name: 'Fulbaria', bnName: 'ফুলবাড়ীয়া' },
      { name: 'Gafargaon', bnName: 'গফরগাঁও' },
      { name: 'Gauripur', bnName: 'গৌরীপুর' },
      { name: 'Haluaghat', bnName: 'হালুয়াঘাট' },
      { name: 'Ishwarganj', bnName: 'ঈশ্বরগঞ্জ' },
      { name: 'Muktagachha', bnName: 'মুক্তাগাছা' },
      { name: 'Nandail', bnName: 'নান্দাইল' },
      { name: 'Phulpur', bnName: 'ফুলপুর' },
      { name: 'Trishal', bnName: 'ত্রিশাল' },
      { name: 'Tara Khanda', bnName: 'তারাকান্দা' }
    ]
  },
  {
    id: 'jamalpur',
    name: 'Jamalpur',
    bnName: 'জামালপুর',
    division: 'Mymensingh',
    upazilas: [
      { name: 'Jamalpur Sadar', bnName: 'জামালপুর সদর' },
      { name: 'Bakshiganj', bnName: 'বকশীগঞ্জ' },
      { name: 'Dewanganj', bnName: 'দেওয়ানগঞ্জ' },
      { name: 'Islampur', bnName: 'ইসলামপুর' },
      { name: 'Madarganj', bnName: 'মাদারগঞ্জ' },
      { name: 'Melandaha', bnName: 'মেলান্দহ' },
      { name: 'Sarishabari', bnName: 'সরিষাবাড়ী' }
    ]
  },
  {
    id: 'netrokona',
    name: 'Netrokona',
    bnName: 'নেত্রকোণা',
    division: 'Mymensingh',
    upazilas: [
      { name: 'Netrokona Sadar', bnName: 'নেত্রকোণা সদর' },
      { name: 'Atpara', bnName: 'আটপাড়া' },
      { name: 'Barhatta', bnName: 'বারহাট্টা' },
      { name: 'Durgapur', bnName: 'দুর্গাপুর' },
      { name: 'Khaliajuri', bnName: 'খালিয়াজুড়ী' },
      { name: 'Kalmakanda', bnName: 'কলমাকান্দা' },
      { name: 'Kendua', bnName: 'কেন্দুয়া' },
      { name: 'Madan', bnName: 'মদন' },
      { name: 'Mohanganj', bnName: 'মোহনগঞ্জ' },
      { name: 'Purbadhala', bnName: 'পূর্বধলা' }
    ]
  },
  {
    id: 'sherpur',
    name: 'Sherpur',
    bnName: 'শেরপুর',
    division: 'Mymensingh',
    upazilas: [
      { name: 'Sherpur Sadar', bnName: 'শেরপুর সদর' },
      { name: 'Jhenaigati', bnName: 'ঝিনাইগাতী' },
      { name: 'Nakla', bnName: 'নকলা' },
      { name: 'Nalitabari', bnName: 'নালিতাবাড়ী' },
      { name: 'Sreebardi', bnName: 'শ্রীবরদী' }
    ]
  }
];

export const getDistrictByName = (name: string): DistrictItem | undefined => {
  if (!name) return undefined;
  const lower = name.toLowerCase().trim();
  return BANGLADESH_DISTRICTS.find(
    d => d.name.toLowerCase() === lower || d.bnName.toLowerCase() === lower || d.id === lower
  );
};
