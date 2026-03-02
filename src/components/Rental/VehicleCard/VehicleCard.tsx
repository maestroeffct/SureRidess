// import React from 'react';
// import { View, Image, TouchableOpacity } from 'react-native';
// import Icon from '@react-native-vector-icons/ionicons';

// import { Typo } from '@/components/AppText/Typo';
// import styles from './styles';

// const VehicleCard = ({ vehicle, onPress }: any) => {
//   return (
//     <TouchableOpacity style={styles.card} activeOpacity={0.9}>
//       {/* IMAGE */}
//       <View>
//         <Image
//           source={{
//             uri: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a',
//           }}
//           style={styles.image}
//         />

//         <View style={styles.badges}>
//           <View style={styles.badgeLight}>
//             <Typo variant="caption">Van</Typo>
//           </View>
//           <View style={styles.badgeGreen}>
//             <Typo variant="caption" style={{ color: '#fff' }}>
//               Verified
//             </Typo>
//           </View>
//         </View>
//       </View>

//       {/* CONTENT */}
//       <View style={styles.cardContent}>
//         <Typo variant="subheading">Toyota RAV4</Typo>

//         <View style={styles.locationRow}>
//           <Icon name="location-outline" size={14} />
//           <Typo variant="caption">Ogun State</Typo>
//         </View>

//         {/* FEATURES */}
//         <View style={styles.features}>
//           <Feature label="Automatic" />
//           <Feature label="5" icon="people-outline" />
//           <Feature label="A/C" />
//           <Feature label="Unlimited Mileage" />
//         </View>

//         {/* FOOTER */}
//         <View style={styles.footer}>
//           <View>
//             <View style={styles.checkRow}>
//               <Icon name="checkmark" size={16} color="#0B6E4F" />
//               <Typo variant="caption">Instant confirmation</Typo>
//             </View>
//             <View style={styles.checkRow}>
//               <Icon name="checkmark" size={16} color="#0B6E4F" />
//               <Typo variant="caption">Free cancellation</Typo>
//             </View>
//           </View>
//         </View>

//         <View style={styles.price}>
//           <Typo variant="caption">Day/</Typo>
//           <Typo style={styles.amount}>₦250</Typo>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// };

// export default VehicleCard;
