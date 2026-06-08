import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Svg, {
  G,
  Mask,
  Path,
  Rect,
  Circle as SvgCircle
} from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CircleManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    circleId?: string | number;
    circleName?: string;
    userRole?: string;
    onOpenAdminManagement?: (type?: string) => void;
    onOpenEditCircle?: () => void;
    onAddPeople?: () => void;
    onLeaveCircle?: () => void;
}

const CircleManagementModal: React.FC<CircleManagementModalProps> = ({
    isOpen,
    onClose,
    circleId,
    circleName = "Selected Circle Name",
    userRole = "Member",
    onOpenAdminManagement,
    onOpenEditCircle,
    onAddPeople,
    onLeaveCircle
}) => {
    if (!isOpen) return null;

    const formattedRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);

    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#113C9C" />
                        <Text style={styles.headerTitle}>{circleName}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Hero Card */}
                    <View style={styles.heroCard}>
                        {/* <View style={styles.heroGraphicContainer}>
                            <View style={styles.circleGraphic}>
                                <View style={[styles.memberIcon, { top: 0, left: '35%' }]}>
                                    <Ionicons name="person-outline" size={16} color="#1A1A1A" />
                                </View>
                                <View style={[styles.memberIcon, { bottom: 5, left: '35%' }]}>
                                    <Ionicons name="person-outline" size={16} color="#1A1A1A" />
                                </View>
                                <View style={[styles.memberIcon, { top: '35%', left: -5 }]}>
                                    <Ionicons name="person-outline" size={16} color="#1A1A1A" />
                                </View>
                                <View style={[styles.memberIcon, { top: '35%', right: -5 }]}>
                                    <Ionicons name="person-outline" size={16} color="#1A1A1A" />
                                </View>
                                <View style={styles.innerGraphicCircle} />
                            </View>
                        </View> */}

                             <View
                                            style={{
                                              width: 80,
                                              height: 80,
                                              borderRadius: 40,
                                              backgroundColor: "white",
                                              justifyContent: "center",
                                              alignItems: "center",
                                              marginRight: 12,
                                              shadowColor: "#000",
                                              shadowOffset: { width: 0, height: 2 },
                                              shadowOpacity: 0.1,
                                              shadowRadius: 4,
                                              elevation: 2,
                                            }}
                                          >
                                            <Svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                              {/* Three Green Arcs */}
                                              <SvgCircle 
                                                cx="40" 
                                                cy="40" 
                                                r="28" 
                                                stroke="#3DCA1D" 
                                                strokeWidth="1.5"
                                                strokeDasharray="42 16.5"
                                                strokeDashoffset="10"
                                              />
                        
                                              {/* User Icon 1 (Top Left) */}
                                              <G transform="translate(6, 14)">
                                                <SvgCircle cx="13" cy="13" r="13" fill="white" />
                                                <Path 
                                                  d="M16.1148 13.22C16.6396 12.7581 17.0605 12.1869 17.3491 11.545C17.6376 10.9032 17.7869 10.2057 17.7869 9.5C17.7869 8.17392 17.2687 6.90215 16.3464 5.96447C15.4241 5.02678 14.1732 4.5 12.8689 4.5C11.5645 4.5 10.3136 5.02678 9.39128 5.96447C8.46897 6.90215 7.95082 8.17392 7.95082 9.5C7.95081 10.2057 8.10013 10.9032 8.38865 11.545C8.67716 12.1869 9.09812 12.7581 9.62295 13.22C8.24604 13.8539 7.07783 14.8775 6.25801 16.1685C5.43819 17.4596 5.00145 18.9633 5 20.5C5 20.7652 5.10363 21.0196 5.28809 21.2071C5.47255 21.3946 5.72274 21.5 5.98361 21.5C6.24448 21.5 6.49466 21.3946 6.67912 21.2071C6.86358 21.0196 6.96721 20.7652 6.96721 20.5C6.96721 18.9087 7.58899 17.3826 8.69576 16.2574C9.80254 15.1321 11.3036 14.5 12.8689 14.5C14.4341 14.5 15.9352 15.1321 17.0419 16.2574C18.1487 17.3826 18.7705 18.9087 18.7705 20.5C18.7705 20.7652 18.8741 21.0196 19.0586 21.2071C19.243 21.3946 19.4932 21.5 19.7541 21.5C20.015 21.5 20.2652 21.3946 20.4496 21.2071C20.6341 21.0196 20.7377 20.7652 20.7377 20.5C20.7363 18.9633 20.2995 17.4596 19.4797 16.1685C18.6599 14.8775 17.4917 13.8539 16.1148 13.22ZM12.8689 12.5C12.2852 12.5 11.7147 12.3241 11.2295 11.9944C10.7442 11.6648 10.366 11.1962 10.1427 10.648C9.91931 10.0999 9.86087 9.49667 9.97473 8.91473C10.0886 8.33279 10.3696 7.79824 10.7823 7.37868C11.195 6.95912 11.7208 6.6734 12.2932 6.55764C12.8656 6.44189 13.4589 6.5013 13.9981 6.72836C14.5373 6.95542 14.9981 7.33994 15.3224 7.83329C15.6466 8.32664 15.8197 8.90666 15.8197 9.5C15.8197 10.2957 15.5088 11.0587 14.9554 11.6213C14.402 12.1839 13.6515 12.5 12.8689 12.5Z" 
                                                  fill="#031C55" 
                                                  transform="translate(0, 0)"
                                                />
                                              </G>
                        
                                              {/* User Icon 2 (Top Right) */}
                                              <G transform="translate(48, 14)">
                                                <SvgCircle cx="13" cy="13" r="13" fill="white" />
                                                <Path 
                                                  d="M16.1148 13.22C16.6396 12.7581 17.0605 12.1869 17.3491 11.545C17.6376 10.9032 17.7869 10.2057 17.7869 9.5C17.7869 8.17392 17.2687 6.90215 16.3464 5.96447C15.4241 5.02678 14.1732 4.5 12.8689 4.5C11.5645 4.5 10.3136 5.02678 9.39128 5.96447C8.46897 6.90215 7.95082 8.17392 7.95082 9.5C7.95081 10.2057 8.10013 10.9032 8.38865 11.545C8.67716 12.1869 9.09812 12.7581 9.62295 13.22C8.24604 13.8539 7.07783 14.8775 6.25801 16.1685C5.43819 17.4596 5.00145 18.9633 5 20.5C5 20.7652 5.10363 21.0196 5.28809 21.2071C5.47255 21.3946 5.72274 21.5 5.98361 21.5C6.24448 21.5 6.49466 21.3946 6.67912 21.2071C6.86358 21.0196 6.96721 20.7652 6.96721 20.5C6.96721 18.9087 7.58899 17.3826 8.69576 16.2574C9.80254 15.1321 11.3036 14.5 12.8689 14.5C14.4341 14.5 15.9352 15.1321 17.0419 16.2574C18.1487 17.3826 18.7705 18.9087 18.7705 20.5C18.7705 20.7652 18.8741 21.0196 19.0586 21.2071C19.243 21.3946 19.4932 21.5 19.7541 21.5C20.015 21.5 20.2652 21.3946 20.4496 21.2071C20.6341 21.0196 20.7377 20.7652 20.7377 20.5C20.7363 18.9633 20.2995 17.4596 19.4797 16.1685C18.6599 14.8775 17.4917 13.8539 16.1148 13.22ZM12.8689 12.5C12.2852 12.5 11.7147 12.3241 11.2295 11.9944C10.7442 11.6648 10.366 11.1962 10.1427 10.648C9.91931 10.0999 9.86087 9.49667 9.97473 8.91473C10.0886 8.33279 10.3696 7.79824 10.7823 7.37868C11.195 6.95912 11.7208 6.6734 12.2932 6.55764C12.8656 6.44189 13.4589 6.5013 13.9981 6.72836C14.5373 6.95542 14.9981 7.33994 15.3224 7.83329C15.6466 8.32664 15.8197 8.90666 15.8197 9.5C15.8197 10.2957 15.5088 11.0587 14.9554 11.6213C14.402 12.1839 13.6515 12.5 12.8689 12.5Z" 
                                                  fill="#031C55" 
                                                />
                                              </G>
                        
                                              {/* User Icon 3 (Bottom Center) */}
                                              <G transform="translate(27, 48)">
                                                <SvgCircle cx="13" cy="13" r="13" fill="white" />
                                                <Path 
                                                  d="M16.1148 13.22C16.6396 12.7581 17.0605 12.1869 17.3491 11.545C17.6376 10.9032 17.7869 10.2057 17.7869 9.5C17.7869 8.17392 17.2687 6.90215 16.3464 5.96447C15.4241 5.02678 14.1732 4.5 12.8689 4.5C11.5645 4.5 10.3136 5.02678 9.39128 5.96447C8.46897 6.90215 7.95082 8.17392 7.95082 9.5C7.95081 10.2057 8.10013 10.9032 8.38865 11.545C8.67716 12.1869 9.09812 12.7581 9.62295 13.22C8.24604 13.8539 7.07783 14.8775 6.25801 16.1685C5.43819 17.4596 5.00145 18.9633 5 20.5C5 20.7652 5.10363 21.0196 5.28809 21.2071C5.47255 21.3946 5.72274 21.5 5.98361 21.5C6.24448 21.5 6.49466 21.3946 6.67912 21.2071C6.86358 21.0196 6.96721 20.7652 6.96721 20.5C6.96721 18.9087 7.58899 17.3826 8.69576 16.2574C9.80254 15.1321 11.3036 14.5 12.8689 14.5C14.4341 14.5 15.9352 15.1321 17.0419 16.2574C18.1487 17.3826 18.7705 18.9087 18.7705 20.5C18.7705 20.7652 18.8741 21.0196 19.0586 21.2071C19.243 21.3946 19.4932 21.5 19.7541 21.5C20.015 21.5 20.2652 21.3946 20.4496 21.2071C20.6341 21.0196 20.7377 20.7652 20.7377 20.5C20.7363 18.9633 20.2995 17.4596 19.4797 16.1685C18.6599 14.8775 17.4917 13.8539 16.1148 13.22ZM12.8689 12.5C12.2852 12.5 11.7147 12.3241 11.2295 11.9944C10.7442 11.6648 10.366 11.1962 10.1427 10.648C9.91931 10.0999 9.86087 9.49667 9.97473 8.91473C10.0886 8.33279 10.3696 7.79824 10.7823 7.37868C11.195 6.95912 11.7208 6.6734 12.2932 6.55764C12.8656 6.44189 13.4589 6.5013 13.9981 6.72836C14.5373 6.95542 14.9981 7.33994 15.3224 7.83329C15.6466 8.32664 15.8197 8.90666 15.8197 9.5C15.8197 10.2957 15.5088 11.0587 14.9554 11.6213C14.402 12.1839 13.6515 12.5 12.8689 12.5Z" 
                                                  fill="#031C55" 
                                                />
                                              </G>
                                            </Svg>
                                          </View>
                        <View style={styles.heroTextContainer}>
                            <Text style={styles.heroTitle}>Expand your safety network</Text>
                            <Text style={styles.heroSubtitle}>
                                We recommend to invite 3 to 4 members to your emergency contacts in your circle.
                            </Text>
                        </View>
                    </View>

                    {/* Pagination Dots */}
                    <View style={styles.paginationContainer}>
                        <View style={[styles.dot, styles.activeDot]} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View>

                    {/* Circle Details Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionHeaderText}>{circleName} Circle details</Text>
                        </View>

                        <View style={styles.menuItem}>
                            <TouchableOpacity onPress={onOpenEditCircle}>
                                <Text style={styles.menuItemText}>Edit Circle Name</Text>
                            </TouchableOpacity>

                            <Text style={styles.roleText}>{circleName}</Text>
                        </View>


                    </View>

                    {/* Circle Management Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionHeaderText}>{circleName} Circle Management</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                // We'll trigger a shared handler or state
                                if (onOpenAdminManagement) {
                                    // No longer hacky, properly typed!
                                    onOpenAdminManagement('my-role');
                                }
                            }}
                        >
                            <Text style={styles.menuItemText}>My Role</Text>
                            <Text style={styles.roleText}>{formattedRole}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => onOpenAdminManagement?.()}>
                            <Text style={styles.menuItemText}>Change Admin Status</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={onAddPeople}>
                            <Text style={styles.menuItemText}>Add people to Circle</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={onLeaveCircle}>
                            <Text style={styles.leaveCircleText}>Leave Circle</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: { flexDirection: "row", alignItems: "center" },
    headerTitle: {
        fontSize: 18,
        fontWeight: "500",
        color: "#113C9C",
        marginLeft: 12
    },
    content: { paddingHorizontal: 20 },

    heroCard: {
        backgroundColor: "#0D389D",
        borderRadius: 16,
        padding: 24,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },
    heroGraphicContainer: {
        width: 80,
        height: 80,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    circleGraphic: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
    },
    innerGraphicCircle: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        borderWidth: 1.5,
        borderColor: "#4ADE80",
        borderStyle: 'solid',
    },
    memberIcon: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        zIndex: 1,
    },
    heroTextContainer: {
        flex: 1,
    },
    heroTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
    },
    heroSubtitle: {
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: 13,
        lineHeight: 18,
    },

    paginationContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 16,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#DBEAFE",
        marginHorizontal: 3,
    },
    activeDot: {
        backgroundColor: "#3B82F6",
        width: 8, // Optional: slightly larger for active
    },

    section: {
        marginTop: 16,
        marginBottom: 8,
    },
    sectionHeader: {
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        paddingBottom: 8,
        marginBottom: 16,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },

    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        // Optional: add a very subtle separator if needed, but image shows clean spacing
    },
    menuItemText: {
        fontSize: 16,
        color: "#113C9C",
        fontWeight: "500",
    },
    roleText: {
        fontSize: 16,
        color: "#3B82F6",
        fontWeight: "500",
    },
    leaveCircleText: {
        fontSize: 16,
        color: "#113C9C",
        fontWeight: "500",
    },
});

export default CircleManagementModal;
